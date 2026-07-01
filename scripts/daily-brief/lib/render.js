/** 브리핑 JSON 을 사람이 읽는 형식으로 변환한다. */

const dateLabelKST = (iso) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(iso));

export function renderMarkdown(brief) {
  const date = dateLabelKST(brief.meta?.generatedAt || Date.now());
  const lines = [];
  lines.push(`# 📰 오늘의 한경 브리핑 — ${date}`);
  if (brief.headline) lines.push(`\n**${brief.headline}**`);
  if (brief.tldr?.length) {
    lines.push('\n## 한눈에');
    brief.tldr.forEach((t) => lines.push(`- ${t}`));
  }
  (brief.sections || []).forEach((s) => {
    lines.push(`\n## ${s.category}`);
    if (s.summary) lines.push(`_${s.summary}_`);
    (s.items || []).forEach((it) => {
      lines.push(`- **${it.title}**${it.insight ? ` — ${it.insight}` : ''}`);
    });
  });
  lines.push(`\n---\n_source: ${brief.meta?.source || 'rss'} · model: ${brief.meta?.model || ''}_`);
  return lines.join('\n');
}

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderEmailHtml(brief) {
  const date = dateLabelKST(brief.meta?.generatedAt || Date.now());
  const tldr = (brief.tldr || [])
    .map((t) => `<li style="margin:4px 0;">${esc(t)}</li>`)
    .join('');
  const sections = (brief.sections || [])
    .map((s) => {
      const items = (s.items || [])
        .map(
          (it) =>
            `<li style="margin:6px 0;"><b>${esc(it.title)}</b>${
              it.insight ? ` <span style="color:#555;">— ${esc(it.insight)}</span>` : ''
            }</li>`
        )
        .join('');
      const summary = s.summary
        ? `<p style="margin:4px 0 6px;color:#444;font-size:14px;">${esc(s.summary)}</p>`
        : '';
      const isEtf = s.category === 'ETF';
      const accent = isEtf ? '#2563eb' : '#0b5';
      const label = isEtf ? `💠 ${esc(s.category)}` : esc(s.category);
      return `<h3 style="margin:18px 0 6px;color:${accent};border-left:4px solid ${accent};padding-left:8px;">${label}</h3>${summary}<ul style="margin:0;padding-left:20px;">${items}</ul>`;
    })
    .join('');

  return `<!doctype html><html><body style="margin:0;background:#f4f5f7;">
  <div style="max-width:620px;margin:0 auto;background:#fff;font-family:-apple-system,Segoe UI,Roboto,'Apple SD Gothic Neo',sans-serif;color:#1a1a1a;padding:24px;">
    <div style="font-size:13px;color:#888;">${esc(date)}</div>
    <h1 style="font-size:22px;margin:6px 0 2px;">📰 오늘의 한경 브리핑</h1>
    ${brief.headline ? `<p style="font-size:16px;font-weight:600;margin:8px 0 0;">${esc(brief.headline)}</p>` : ''}
    ${tldr ? `<h3 style="margin:18px 0 6px;">한눈에</h3><ul style="margin:0;padding-left:20px;">${tldr}</ul>` : ''}
    ${sections}
    <p style="margin-top:24px;font-size:12px;color:#aaa;">
      한경 RSS 자동 요약 · ${esc(brief.meta?.source || 'rss')} · ${esc(brief.meta?.model || '')}<br/>
      이 메일은 개인 학습/요약 용도로 자동 생성되었습니다.
    </p>
  </div></body></html>`;
}
