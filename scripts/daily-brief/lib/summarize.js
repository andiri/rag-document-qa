import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'node:fs/promises';

// Claude 구조화 출력(JSON) 스키마 — render.js / 웹 뷰어가 그대로 사용한다.
const BRIEF_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    headline: { type: 'string' },
    tldr: { type: 'array', items: { type: 'string' } },
    sections: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: { type: 'string' },
          summary: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                title: { type: 'string' },
                insight: { type: 'string' },
              },
              required: ['title', 'insight'],
            },
          },
        },
        required: ['category', 'summary', 'items'],
      },
    },
  },
  required: ['headline', 'tldr', 'sections'],
};

/**
 * 카테고리별 기사 묶음(또는 지면 PDF 텍스트)을 받아 "오늘의 한경" 분야별 요약을 생성한다.
 *
 * @param {string} promptText   feedsToPromptText() 결과, 또는 지면 PDF 텍스트
 * @param {object} opts
 * @param {string} opts.apiKey  Anthropic API key
 * @param {string} [opts.model] 기본 claude-opus-4-8
 * @param {string} [opts.source] 'rss' | 'pdf'
 */
const SYSTEM = `당신은 바쁜 직장인을 위한 한국경제신문 전담 뉴스 에디터입니다.
독자는 한경 지면을 구독하지만 시간이 없어 못 읽는 사람입니다.
목표: 출근길 5~10분 안에 "오늘 한경이 중요하게 다룬 것"을 분야별로, 맥락까지 파악하게 한다.

원칙:
- 네이버/구글에 흔한 단신 나열이 아니라, 한경 편집 관점에서 "왜 중요한지"와 배경·파급효과를 짚는다.
- 과장·추측 금지. 제공된 내용에 근거해서만 작성한다.
- 같은 사안 중복은 하나로 합친다.
- 숫자·고유명사는 정확히. 모르면 생략한다.
- 한국어로, 간결하지만 충분히 설명적으로 쓴다.`;

const INSTRUCTION = `위 자료를 바탕으로 "오늘의 한경 브리핑"을 분야별로 작성하세요. 충분히 읽을거리가 되도록 조금 길고 자세하게 씁니다.

- headline: 오늘 한경의 가장 큰 이슈 한 줄(45자 이내).
- tldr: 분야를 통틀어 오늘 꼭 알아야 할 핵심 6~9개 불릿(각 70자 이내).
- sections: 자료에 등장한 분야만 포함(증시/부동산/산업/정책/종합 등). 각 분야는
    · summary: 그 분야 오늘의 흐름을 2~3문장으로 요약(맥락·배경 포함),
    · items: 그 분야의 주요 이슈 3~5개. 각 항목은 title(이슈 제목)과 insight(왜 중요한지/배경/파급효과를 1~2문장으로).`;

function parseBrief(response, { model, source }) {
  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('Claude 응답에 텍스트 블록이 없습니다.');
  let data;
  try {
    data = JSON.parse(textBlock.text);
  } catch {
    const cleaned = textBlock.text.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    data = JSON.parse(cleaned);
  }
  return {
    ...data,
    meta: { model, source, generatedAt: new Date().toISOString(), usage: response.usage },
  };
}

/** 경로 B: 텍스트(RSS 기사 목록)를 받아 요약 */
export async function summarize(promptText, { apiKey, model = 'claude-opus-4-8', source = 'rss' } = {}) {
  const client = new Anthropic({ apiKey, timeout: 120000, maxRetries: 2 });
  const user = `아래는 한국경제신문(한경)의 오늘자 분야별 기사 제목/요약 목록입니다.\n\n${promptText}\n\n${INSTRUCTION}`;
  const response = await client.messages.create({
    model,
    max_tokens: 8000,
    system: SYSTEM,
    output_config: { format: { type: 'json_schema', schema: BRIEF_SCHEMA } },
    messages: [{ role: 'user', content: user }],
  });
  return parseBrief(response, { model, source });
}

/**
 * 경로 C1: 구독 지면 PDF(들)을 Claude에 직접 첨부해(시각적으로) 요약한다.
 * 신문 지면은 스캔 이미지인 경우가 많아 텍스트 추출이 어려우므로 PDF 원본을 그대로 읽힌다.
 *
 * @param {string[]} pdfPaths  로컬 PDF 경로 목록
 */
export async function summarizePdfs(pdfPaths, { apiKey, model = 'claude-opus-4-8' } = {}) {
  const client = new Anthropic({ apiKey, timeout: 300000, maxRetries: 2 });

  const docs = [];
  for (const p of pdfPaths) {
    const data = (await readFile(p)).toString('base64');
    docs.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data },
    });
  }

  const content = [
    {
      type: 'text',
      text: '아래는 사용자가 구독 중인 한국경제신문 "지면(모바일한경)"의 오늘자 페이지(PDF)입니다. 지면 이미지의 기사 제목·본문·표를 읽어 핵심을 파악하세요.',
    },
    ...docs,
    { type: 'text', text: INSTRUCTION },
  ];

  const response = await client.messages.create({
    model,
    max_tokens: 8000,
    system: SYSTEM,
    output_config: { format: { type: 'json_schema', schema: BRIEF_SCHEMA } },
    messages: [{ role: 'user', content }],
  });
  return parseBrief(response, { model, source: 'pdf' });
}
