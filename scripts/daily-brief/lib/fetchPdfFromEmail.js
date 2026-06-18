import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/**
 * 경로 C1 자동화: 받은편지함에서 최근 "지면 PDF 첨부" 메일들을 찾아 PDF를 임시 파일로 저장한다.
 * 아이폰 모바일한경 앱에서 공유 → (단축어로) PDF 만들어 자기 메일로 보내두면,
 * 매일 그 첨부들을 모아 요약 입력으로 쓴다. Gmail 앱 비밀번호로 IMAP 접속.
 *
 * 여러 페이지를 따로 공유(여러 통)해도 모두 모은다.
 *
 * @param {object} opts
 * @param {string} opts.user           Gmail 주소
 * @param {string} opts.pass           Gmail 앱 비밀번호
 * @param {number} [opts.sinceHours]   최근 N시간 이내 메일만(기본 18)
 * @param {string} [opts.fromFilter]   보낸사람 필터(선택)
 * @param {string} [opts.subjectFilter] 제목 포함 필터(선택)
 * @param {number} [opts.maxPdfs]      최대 PDF 개수(기본 12)
 * @returns {Promise<Array<{path:string, subject:string, date:Date}>>}
 */
export async function fetchPdfsFromEmail({
  user,
  pass,
  sinceHours = 18,
  fromFilter,
  subjectFilter,
  maxPdfs = 12,
} = {}) {
  if (!user || !pass) throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD 가 필요합니다.');

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user, pass: pass.replace(/\s+/g, '') },
    logger: false,
    socketTimeout: 30000,
  });

  const found = [];
  await client.connect();
  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      const criteria = { since: new Date(Date.now() - sinceHours * 3600 * 1000) };
      if (fromFilter) criteria.from = fromFilter;
      if (subjectFilter) criteria.subject = subjectFilter;

      const uids = await client.search(criteria, { uid: true });
      if (!uids || uids.length === 0) return [];

      // 최신 메일부터, PDF 첨부를 maxPdfs 개까지 수집
      for (const uid of uids.slice().sort((a, b) => b - a)) {
        if (found.length >= maxPdfs) break;
        const msg = await client.fetchOne(uid, { source: true }, { uid: true });
        if (!msg || !msg.source) continue;
        const parsed = await simpleParser(msg.source);
        const pdfs = (parsed.attachments || []).filter(
          (a) => a.contentType === 'application/pdf' || /\.pdf$/i.test(a.filename || '')
        );
        for (const pdf of pdfs) {
          if (found.length >= maxPdfs) break;
          const outPath = path.join(os.tmpdir(), `hankyung-${uid}-${found.length}.pdf`);
          await writeFile(outPath, pdf.content);
          found.push({ path: outPath, subject: parsed.subject || '', date: parsed.date || new Date() });
        }
      }
      return found;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}
