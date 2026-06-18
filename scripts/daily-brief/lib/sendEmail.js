import nodemailer from 'nodemailer';

/**
 * Gmail SMTP 로 브리핑 메일을 발송한다.
 * 필요한 환경변수:
 *   GMAIL_USER          보내는 Gmail 주소
 *   GMAIL_APP_PASSWORD  Gmail 앱 비밀번호(2단계 인증 후 발급, 일반 비번 아님)
 *   MAIL_TO             받는 주소(쉼표로 여러 명)
 */
export async function sendEmail({ subject, html, text }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.MAIL_TO || user;

  if (!user || !pass) {
    throw new Error('GMAIL_USER / GMAIL_APP_PASSWORD 환경변수가 필요합니다.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass: pass.replace(/\s+/g, '') }, // 앱 비밀번호 공백 제거
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  const info = await transporter.sendMail({
    from: `"한경 브리핑" <${user}>`,
    to,
    subject,
    text,
    html,
  });

  return { messageId: info.messageId, accepted: info.accepted };
}
