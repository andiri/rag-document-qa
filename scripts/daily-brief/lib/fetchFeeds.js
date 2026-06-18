import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 20000,
  headers: {
    // 일부 언론사 RSS 는 기본 UA 를 거부하므로 일반 브라우저 UA 를 사용
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  },
});

const stripHtml = (s = '') =>
  s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * 오늘(현지 기준) 발행된 기사만 남긴다. RSS 에 시간이 없으면 통과시킨다.
 */
const isFromToday = (item, now = new Date()) => {
  const raw = item.isoDate || item.pubDate;
  if (!raw) return true;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return true;
  // KST 기준 같은 날짜인지 비교
  const fmt = (date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  return fmt(d) === fmt(now);
};

/**
 * 설정된 피드들을 병렬로 가져와 카테고리별 기사 목록을 만든다.
 * 한 피드가 실패해도 전체는 계속 진행한다.
 * @param {{feeds: Array<{category:string,name:string,url:string,limit?:number}>}} config
 * @param {{todayOnly?: boolean}} options
 */
// parser 의 timeout 만으로 끊기지 않는 hang 을 방지하는 하드 타임아웃
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout ${ms}ms: ${label}`)), ms)
    ),
  ]);

export async function fetchFeeds(config, { todayOnly = true } = {}) {
  const results = await Promise.allSettled(
    config.feeds.map(async (feed) => {
      console.log(`  · 수집: ${feed.name} (${feed.url})`);
      const parsed = await withTimeout(parser.parseURL(feed.url), 25000, feed.name);
      let items = (parsed.items || []).map((it) => ({
        title: (it.title || '').trim(),
        link: it.link,
        publishedAt: it.isoDate || it.pubDate || null,
        summary: stripHtml(it.contentSnippet || it.content || it.summary || ''),
      }));
      if (todayOnly) {
        const now = new Date();
        const todayItems = items.filter((it) => isFromToday({ isoDate: it.publishedAt }, now));
        // 오늘 기사가 하나도 없으면(주말/발행 전) 최신 기사로 폴백
        if (todayItems.length > 0) items = todayItems;
      }
      items = items.slice(0, feed.limit || 8);
      return { category: feed.category, name: feed.name, url: feed.url, items };
    })
  );

  const categories = [];
  const errors = [];
  results.forEach((r, i) => {
    const feed = config.feeds[i];
    if (r.status === 'fulfilled') {
      categories.push(r.value);
    } else {
      errors.push({ feed: feed.name, url: feed.url, error: String(r.reason?.message || r.reason) });
    }
  });

  return { categories, errors };
}

/** 카테고리별 기사들을 LLM 프롬프트용 텍스트로 직렬화 */
export function feedsToPromptText({ categories }) {
  return categories
    .map((c) => {
      const lines = c.items
        .map((it, idx) => `  ${idx + 1}. ${it.title}${it.summary ? ` — ${it.summary.slice(0, 200)}` : ''}`)
        .join('\n');
      return `## [${c.category}] ${c.name}\n${lines || '  (오늘 기사 없음)'}`;
    })
    .join('\n\n');
}
