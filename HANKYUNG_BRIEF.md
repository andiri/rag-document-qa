# 📰 오늘의 한경 브리핑 — 매일 아침 한경 뉴스 자동 요약

구독 중인 **한국경제(한경)** 뉴스를 매일 아침 **분야별로 요약**해 **이메일 + 웹페이지**로 받아보는 자동화 파이프라인입니다.

> **왜 만드나?** 네이버·구글 경제뉴스는 알고리즘(클릭·속보)이 고른 단신 모음입니다.
> 반면 한경 지면은 **편집국이 "오늘 뭐가 중요한가"를 우선순위로 고른** 것입니다.
> 이 차이(편집 관점의 핵심 + 깊이)를 살려, 출근길 3~5분에 핵심만 압축해 전달합니다.

---

## 동작 방식

```
[한경 RSS / 내 지면 PDF]  →  LLM 분야별 요약  →  public/briefs/*.json
                                                   ├─ 📧 Gmail 발송
                                                   └─ 🌐 웹 뷰어(/briefs/)
        ▲
   GitHub Actions 가 매일 07:00(KST) 자동 실행
```

- **경로 B (기본, 합법·완전자동):** 한경 RSS(무료 공개 기사)를 수집해 요약.
- **경로 C1 (확장, 지면 전용):** 내가 결제한 **모바일한경 지면 PDF** 를 직접 넣어 요약
  → `npm run brief:pdf -- ./내려받은지면.pdf`. 내가 정당하게 보유한 콘텐츠를 요약하는 개인 용도입니다.
- ⚠️ 로그인 세션으로 지면을 **자동 크롤링하는 방식은 한경 이용약관(자동수집 금지)·안정성 문제로 포함하지 않았습니다.**

---

## 빠른 시작 (로컬 테스트)

```bash
npm install
npm run brief:dry        # 외부 호출 없이 샘플로 포맷 미리보기
cp .env.example .env     # 키 입력 후
npm run brief:no-email   # 실제 RSS 수집 → 요약 → public/briefs/ 에 JSON 기록(메일 X)
npm run brief            # 위 + 이메일까지 발송
npm run brief:pdf -- ./지면.pdf   # 경로 C1: 지면 PDF 요약
```

웹 뷰어는 `npm run dev` 후 `http://localhost:5173/briefs/` 또는 배포 후 `https://<도메인>/briefs/` 에서 확인합니다.

---

## 매일 자동 실행 설정 (GitHub Actions)

워크플로 파일: `.github/workflows/daily-brief.yml` (매일 07:00 KST + 수동 실행 버튼).

> ⚠️ **예약(cron) 실행은 기본 브랜치(main)에 워크플로가 있을 때만 작동합니다.**
> 지금은 `claude/hankyung-news-summary-r0hsag` 브랜치에 있으니, 자동 실행을 켜려면 main 에 머지하세요.
> 머지 전에도 Actions 탭의 **Run workflow** 버튼(workflow_dispatch)으로 즉시 테스트할 수 있습니다.

### 1) Repo Secrets 등록
`Settings → Secrets and variables → Actions → New repository secret`

| 이름 | 값 |
|---|---|
| `OPENAI_API_KEY` | OpenAI API 키 |
| `GMAIL_USER` | 보내는 Gmail 주소 |
| `GMAIL_APP_PASSWORD` | Gmail **앱 비밀번호** ([발급](https://myaccount.google.com/apppasswords), 2단계 인증 필요) |
| `MAIL_TO` | 받는 주소(쉼표로 여러 명 가능) |

(선택) `Variables` 탭에 `OPENAI_MODEL` = `gpt-4o-mini` 등으로 모델 지정.

### 2) 발송 시각 변경
`daily-brief.yml` 의 `cron: "0 22 * * *"` 수정 (UTC 기준, 07:00 KST = 22:00 UTC 전날).

---

## 피드 주소 확인/수정

`scripts/daily-brief/feeds.config.json` 의 `url` 들은 한경 RSS 안내 페이지
<https://www.hankyung.com/feed> 의 분야별 주소입니다. 사이트 개편으로 slug 가 바뀌면
수집이 0건이 되며, 그 페이지에서 정확한 주소를 확인해 `url` 만 교체하면 됩니다.
(분야 추가/삭제도 이 파일에서.)

---

## 파일 구조

```
scripts/daily-brief/
├── run.js              # 오케스트레이터(CLI)
├── feeds.config.json   # 분야별 RSS 피드 목록
├── sample.brief.json   # --dry-run 미리보기용 샘플
└── lib/
    ├── fetchFeeds.js   # RSS 수집·파싱(경로 B)
    ├── ingestPdf.js    # 지면 PDF 텍스트 추출(경로 C1)
    ├── summarize.js    # OpenAI 분야별 요약
    ├── render.js       # Markdown / 이메일 HTML
    └── sendEmail.js    # Gmail SMTP 발송
public/briefs/
├── index.html          # 웹 뷰어
├── latest.json         # 최신 브리핑
├── <YYYY-MM-DD>.json   # 일자별 아카이브
└── index.json          # 아카이브 목록
.github/workflows/daily-brief.yml
```

## 비용·참고
- 요약 1회는 OpenAI 토큰 소량(분야 요약 기준 보통 수십 원 내외, 모델/분량에 따라 변동).
- LLM 제공자는 OpenAI(기존 repo 스택)로 맞췄습니다. Anthropic(Claude) 등으로 교체하려면 `summarize.js` 한 파일만 바꾸면 됩니다.
