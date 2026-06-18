#!/usr/bin/env node
/**
 * 오늘의 한경 브리핑 — 오케스트레이터(CLI)
 *
 *   node scripts/daily-brief/run.js                # RSS 수집 → 요약 → JSON 기록 + 이메일
 *   node scripts/daily-brief/run.js --no-email     # 메일 발송 생략(웹용 JSON 만)
 *   node scripts/daily-brief/run.js --pdf 지면.pdf  # 경로 C1: 내 지면 PDF 요약
 *   node scripts/daily-brief/run.js --dry-run      # 외부 호출 없이 샘플로 출력/포맷 미리보기
 *
 * 환경변수: OPENAI_API_KEY, OPENAI_MODEL(선택), GMAIL_USER, GMAIL_APP_PASSWORD, MAIL_TO
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

import { fetchFeeds, feedsToPromptText } from './lib/fetchFeeds.js';
import { summarize } from './lib/summarize.js';
import { renderMarkdown, renderEmailHtml } from './lib/render.js';
import { sendEmail } from './lib/sendEmail.js';
import { extractPdfText } from './lib/ingestPdf.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'public', 'briefs');

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const valOf = (f) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : undefined;
};

const dryRun = has('--dry-run');
const noEmail = has('--no-email') || dryRun;
const noWrite = has('--no-write');
const pdfPath = valOf('--pdf');

const todayKST = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

async function buildBrief() {
  if (dryRun) {
    const sample = JSON.parse(
      await readFile(path.join(__dirname, 'sample.brief.json'), 'utf-8')
    );
    return { brief: sample, errors: [] };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY 환경변수가 필요합니다.');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (pdfPath) {
    // 경로 C1: 지면 PDF 요약
    if (!existsSync(pdfPath)) throw new Error(`PDF 를 찾을 수 없습니다: ${pdfPath}`);
    const text = await extractPdfText(pdfPath);
    if (!text.trim()) throw new Error('PDF 에서 텍스트를 추출하지 못했습니다(스캔본일 수 있음).');
    const brief = await summarize(text.slice(0, 60000), { apiKey, model, source: 'pdf' });
    return { brief, errors: [] };
  }

  // 경로 B: RSS 수집 → 요약
  const config = JSON.parse(
    await readFile(path.join(__dirname, 'feeds.config.json'), 'utf-8')
  );
  const { categories, errors } = await fetchFeeds(config, { todayOnly: true });
  const totalItems = categories.reduce((n, c) => n + c.items.length, 0);
  if (totalItems === 0) {
    throw new Error(
      '수집된 기사가 0건입니다. feeds.config.json 의 URL 을 확인하세요(피드 주소 변경 가능).'
    );
  }
  const promptText = feedsToPromptText({ categories });
  const brief = await summarize(promptText, { apiKey, model, source: 'rss' });
  return { brief, errors };
}

async function writeOutputs(brief) {
  if (noWrite) return;
  await mkdir(OUT_DIR, { recursive: true });
  const date = todayKST();

  await writeFile(path.join(OUT_DIR, 'latest.json'), JSON.stringify(brief, null, 2));
  await writeFile(path.join(OUT_DIR, `${date}.json`), JSON.stringify(brief, null, 2));

  // 아카이브 인덱스 갱신
  const indexPath = path.join(OUT_DIR, 'index.json');
  let index = [];
  if (existsSync(indexPath)) {
    try {
      index = JSON.parse(await readFile(indexPath, 'utf-8'));
    } catch {
      index = [];
    }
  }
  const entry = { date, headline: brief.headline || '' };
  index = [entry, ...index.filter((e) => e.date !== date)].slice(0, 60);
  await writeFile(indexPath, JSON.stringify(index, null, 2));
}

async function main() {
  const { brief, errors } = await buildBrief();

  if (errors.length) {
    console.warn('⚠️  일부 피드 실패:');
    errors.forEach((e) => console.warn(`   - ${e.feed}: ${e.error}`));
  }

  // 콘솔 미리보기
  console.log('\n' + renderMarkdown(brief) + '\n');

  await writeOutputs(brief);
  if (!noWrite) console.log(`✅ JSON 기록: public/briefs/latest.json, ${todayKST()}.json`);

  if (!noEmail) {
    const subject = `📰 오늘의 한경 — ${brief.headline || todayKST()}`;
    const result = await sendEmail({
      subject,
      html: renderEmailHtml(brief),
      text: renderMarkdown(brief),
    });
    console.log(`✅ 메일 발송: ${result.accepted?.join(', ')}`);
  } else {
    console.log('✉️  메일 발송 생략(--no-email/--dry-run)');
  }
}

main().catch((err) => {
  console.error('❌ 실패:', err.message);
  process.exit(1);
});
