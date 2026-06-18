import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

/**
 * 경로 C1 자동화: 받은편지함에서 최근 "지면 PDF 첨부" 메일을 찾아 PDF를 임시 파일로 저장한다.
 * 내가 구독한 모바일한경 지면 PDF를 메일로 받거나(또는 자기 자신에게 전달/자동전달 규칙) 두면,
 * 매일 그 첨부를 가져와 요약 입력으로 쓴다. Gmail 앱 비밀번호로 IMAP 접속.
 *
 * @param {object} opts
 * @param {string} opts.user           Gmail 주소
 * @param {string} opts.pass           Gmail 앱 비밀번호
 * @param {number} [opts.sinceHours]   최근 N시간 이내 메일만(기본 18)
 * @param {string} [opts.fromFilter]   보낸사람 필터(선택)
 * @param {string} [opts.subjectFilter] 제목 포함 필터(선택)
 * @returns {Promise<{path:string, subject:string, date:Date}|null>}
 */
export async function fetchLatestPdfFromEmail({
  user,
  pass,
  sinceHours = 18,
  fromFilter,
  subjectFilter,
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

  await client.connect();
  try {
    const lock = await client.getMailboxLock('INBOX');
    try {
      const criteria = { since: new Date(Date.now() - sinceHours * 3600 * 1000) };
      if (fromFilter) criteria.from = fromFilter;
      if (subjectFilter) criteria.subject = subjectFilter;

      const uids = await client.search(criteria, { uid: true });
      if (!uids || uids.length === 0) return null;

      // 최신 메일부터 검사해 첫 PDF 첨부를 사용
      for (const uid of uids.slice().sort((a, b) => b - a)) {
        const msg = await client.fetchOne(uid, { source: true }, { uid: true });
        if (!msg || !msg.source) continue;
        const parsed = await simpleParser(msg.source);
        const pdf = (parsed.attachments || []).find(
          (a) => a.contentType === 'application/pdf' || /\.pdf$/i.test(a.filename || '')
        );
        if (pdf) {
          const outPath = path.join(os.tmpdir(), `hankyung-jimyeon-${uid}.pdf`);
          await writeFile(outPath, pdf.content);
          return { path: outPath, subject: parsed.subject || '', date: parsed.date || new Date() };
        }
      }
      return null;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }
}
