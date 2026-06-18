import OpenAI from 'openai';

/**
 * 카테고리별 기사 묶음을 받아 "오늘의 한경" 분야별 요약(JSON)을 생성한다.
 * 출력 스키마는 render.js / 웹 뷰어가 그대로 사용한다.
 *
 * @param {string} promptText   feedsToPromptText() 결과 (또는 지면 PDF 텍스트)
 * @param {object} opts
 * @param {string} opts.apiKey  OpenAI API key
 * @param {string} [opts.model] 기본 gpt-4o-mini
 * @param {string} [opts.source] 'rss' | 'pdf' (프롬프트 문구 조정용)
 */
export async function summarize(promptText, { apiKey, model = 'gpt-4o-mini', source = 'rss' } = {}) {
  const openai = new OpenAI({ apiKey });

  const sourceNote =
    source === 'pdf'
      ? '아래는 사용자가 구독 중인 한국경제신문 "지면(모바일한경)" 의 오늘자 기사 텍스트입니다.'
      : '아래는 한국경제신문(한경)의 오늘자 분야별 기사 제목/요약 목록입니다.';

  const systemPrompt = `당신은 바쁜 직장인을 위한 한국경제신문 전담 뉴스 에디터입니다.
독자는 한경 지면을 구독하지만 시간이 없어 못 읽는 사람입니다.
목표: 출근길 3~5분 안에 "오늘 한경이 중요하게 다룬 것"을 분야별로 파악하게 한다.

규칙:
- 네이버/구글에 흔한 단신 나열이 아니라, 한경 편집 관점에서 "왜 중요한지"를 한 줄 통찰로 덧붙인다.
- 과장/추측 금지. 제공된 내용에 근거해서만 작성한다.
- 같은 사안 중복은 하나로 합친다.
- 숫자/고유명사는 정확히. 모르면 생략한다.
- 반드시 유효한 JSON 만 출력한다(마크다운 코드펜스 없이).`;

  const userPrompt = `${sourceNote}

${promptText}

위 내용을 바탕으로 다음 JSON 스키마로 "오늘의 한경 브리핑" 을 작성하세요.

{
  "headline": "오늘 한경의 가장 큰 이슈 한 줄(40자 이내)",
  "tldr": ["핵심만 추린 5~7개 불릿(각 60자 이내, 분야 무관 가장 중요한 것)"],
  "sections": [
    {
      "category": "증시" | "부동산" | "산업" | "정책" | "종합" | 그 외 입력에 있는 분야명,
      "items": [
        { "title": "이슈 제목(간결)", "insight": "왜 중요한지/맥락 한 줄" }
      ]
    }
  ]
}

- tldr 는 분야 통틀어 오늘 꼭 알아야 할 것 위주.
- sections 는 입력에 등장한 분야만 포함하고, 분야당 2~4개 항목.
- JSON 외 다른 텍스트는 절대 출력하지 마세요.`;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content;
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    // 혹시 코드펜스가 섞여 오면 제거 후 재시도
    const cleaned = raw.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    data = JSON.parse(cleaned);
  }

  return {
    ...data,
    meta: {
      model,
      source,
      generatedAt: new Date().toISOString(),
      usage: response.usage,
    },
  };
}
