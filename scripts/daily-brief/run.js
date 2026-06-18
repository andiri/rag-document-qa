#!/usr/bin/env node
/**
 * 오늘의 한경 브리핑 — 오케스트레이터(CLI)
 *
 *   node scripts/daily-brief/run.js                # RSS 수집 → 요약 → JSON 기록 + 이메일
 *   node scripts/daily-brief/run.js --no-email     # 메일 발송 생략(웹용 JSON 만)
 *   node scripts/daily-brief/run.js --pdf 지면.pdf  # 경로 C1: 로컬 지면 PDF 요약
 *   node scripts/daily-brief/run.js --from-email   # 경로 C1 자동화: 받은편지함의 지면 PDF 요약(없으면 RSS)
 *   node scripts/daily-brief/run.js --dry-run      # 외부 호출 없이 샘플로 출력/포맷 미리보기
 *
 * 환경변수: ANTHROPIC_API_KEY, ANTHROPIC_MODEL(선택), GMAIL_USER, GMAIL_APP_PASSWORD, MAIL_TO,
 *           PDF_FROM_EMAIL(=1이면 지면 PDF 자동수집), PDF_EMAIL_FROM/PDF_EMAIL_SUBJECT(선택 필터)
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

import { fetchFeeds, feedsToPromptText } from './lib/fetchFeeds.js';
import { summarize, summarizePdfs } from './lib/summarize.js';
import { renderMarkdown, renderEmailHtml } from './lib/render.js';
import { sendEmail } from './lib/sendEmail.js';
import { fetchPdfsFromEmail } from './lib/fetchPdfFromEmail.js';

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY 환경변수가 필요합니다.');
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

  // 지면 PDF 소스 결정: 명시적 --pdf(로컬), 또는 받은편지함 자동수집(경로 C1 자동화)
  let pdfList = pdfPath ? [pdfPath] : [];
  if (pdfList.length === 0 && (has('--from-email') || process.env.PDF_FROM_EMAIL === '1')) {
    console.log('▶ 받은편지함에서 지면 PDF 검색…');
    const found = await fetchPdfsFromEmail({
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
      sinceHours: Number(process.env.PDF_EMAIL_SINCE_HOURS || 18),
      fromFilter: process.env.PDF_EMAIL_FROM || undefined,
      subjectFilter: process.env.PDF_EMAIL_SUBJECT || undefined,
    });
    if (found.length > 0) {
      console.log(`▶ 지면 PDF ${found.length}건 발견 → C1 요약`);
      pdfList = found.map((f) => f.path);
    } else {
      console.warn('⚠️ 최근 지면 PDF 메일을 못 찾음 → RSS(경로 B)로 대체');
    }
  }

  if (pdfList.length > 0) {
    // 경로 C1: 지면 PDF(들)을 Claude에 직접 첨부해 시각적으로 요약(스캔 이미지 지면 대응)
    for (const p of pdfList) {
      if (!existsSync(p)) throw new Error(`PDF 를 찾을 수 없습니다: ${p}`);
    }
    console.log(`▶ Claude 요약 생성 중(지면 PDF ${pdfList.length}건, 직접 첨부)…`);
    const brief = await summarizePdfs(pdfList, { apiKey, model });
    console.log('▶ 요약 완료');
    return { brief, errors: [] };
  }

  // 경로 B: RSS 수집 → 요약
  const config = JSON.parse(
    await readFile(path.join(__dirname, 'feeds.config.json'), 'utf-8')
  );
  console.log('▶ RSS 수집 시작…');
  const { categories, errors } = await fetchFeeds(config, { todayOnly: true });
  const totalItems = categories.reduce((n, c) => n + c.items.length, 0);
  console.log(`▶ 수집 완료: ${totalItems}건 (실패 피드 ${errors.length}개)`);
  if (totalItems === 0) {
    throw new Error(
      '수집된 기사가 0건입니다. feeds.config.json 의 URL 을 확인하세요(피드 주소 변경 가능).'
    );
  }
  const promptText = feedsToPromptText({ categories });
  console.log('▶ Claude 요약 생성 중…');
  const brief = await summarize(promptText, { apiKey, model, source: 'rss' });
  console.log('▶ 요약 완료');
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
    console.log('▶ 이메일 발송 중…');
    const subject = `📰 오늘의 한경 — ${brief.headline || todayKST()}`;
    const result = await Promise.race([
      sendEmail({
        subject,
        html: renderEmailHtml(brief),
        text: renderMarkdown(brief),
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('이메일 발송 타임아웃(40s)')), 40000)
      ),
    ]);
    console.log(`✅ 메일 발송: ${result.accepted?.join(', ')}`);
  } else {
    console.log('✉️  메일 발송 생략(--no-email/--dry-run)');
  }
}

main()
  .then(() => {
    // RSS keep-alive 소켓/SMTP 연결 등 열린 핸들로 이벤트 루프가 안 비워지는 것을 방지
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ 실패:', err.message);
    process.exit(1);
  });
