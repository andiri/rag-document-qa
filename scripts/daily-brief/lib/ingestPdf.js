import { readFile } from 'node:fs/promises';

/**
 * 경로 C1: 내가 구독한 모바일한경 "지면 PDF" 의 텍스트를 추출한다.
 * 사용자가 직접 내려받은(=정당하게 보유한) PDF 를 요약 입력으로 넣는 용도.
 * pdfjs-dist 의 legacy 빌드를 Node 에서 사용한다.
 *
 * @param {string} pdfPath 로컬 PDF 경로
 * @returns {Promise<string>} 추출된 본문 텍스트
 */
export async function extractPdfText(pdfPath) {
  // pdfjs 는 ESM legacy 빌드를 동적 import 한다(브라우저 전역 의존 회피).
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const data = new Uint8Array(await readFile(pdfPath));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

  const pages = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ('str' in it ? it.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text) pages.push(`--- p.${p} ---\n${text}`);
  }
  await doc.cleanup();
  return pages.join('\n\n');
}
