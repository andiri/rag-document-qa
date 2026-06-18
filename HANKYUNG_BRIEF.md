# 📰 오늘의 한경 브리핑 — 매일 아침 한경 뉴스 자동 요약

구독 중인 **한국경제(한경)** 뉴스를 매일 아침 **분야별로 요약**해 **이메일 + 웹페이지**로 받아보는 자동화 파이프라인입니다. 요약 LLM은 **Claude(Anthropic)** 입니다.

> **왜 만드나?** 네이버·구글 경제뉴스는 알고리즘(클릭·속보)이 고른 단신 모음입니다.
> 반면 한경 지면은 **편집국이 "오늘 뭐가 중요한가"를 우선순위로 고른** 것입니다.
> 이 차이(편집 관점의 핵심 + 깊이)를 살려, 출근길 5~10분에 분야별 핵심과 맥락을 전달합니다.

---

## 동작 방식

```
[한경 RSS / 내 지면 PDF]  →  Claude 분야별 요약  →  public/briefs/*.json
                                                     ├─ 📧 Gmail 발송
                                                     └─ 🌐 웹 뷰어(/briefs/)
        ▲
   GitHub Actions 가 매일 아침 07:00(KST) 자동 실행 (월~토, 일요일 제외)
```

- **경로 B (기본, 합법·완전자동):** 한경 RSS(무료 공개 기사)를 수집해 요약.
- **경로 C1 (지면 전용):** 내가 결제한 **모바일한경 지면 PDF** 를 요약. 두 가지 방식:
  - **로컬:** `npm run brief:pdf -- ./내려받은지면.pdf`
  - **자동(권장):** 받은편지함에 지면 PDF가 들어오면 **IMAP으로 자동 수집해 요약**(아래 "C1 자동화" 참고). 없으면 RSS로 자동 폴백.
- ⚠️ 로그인 세션으로 지면을 **자동 크롤링하는 방식은 한경 이용약관(자동수집 금지)·안정성 문제로 포함하지 않았습니다.**

---

## 빠른 시작 (로컬 테스트)

```bash
npm install
npm run brief:dry        # 외부 호출 없이 샘플로 포맷 미리보기
cp .env.example .env     # 키 입력 후
npm run brief:no-email   # 실제 RSS 수집 → Claude 요약 → public/briefs/ 기록(메일 X)
npm run brief            # 위 + 이메일까지 발송
npm run brief:pdf -- ./지면.pdf            # 경로 C1: 로컬 지면 PDF
node scripts/daily-brief/run.js --from-email  # 경로 C1 자동화: 받은편지함의 지면 PDF
```

웹 뷰어: `npm run dev` 후 `http://localhost:5173/briefs/` 또는 배포 후 `https://<도메인>/briefs/`.

---

## 매일 자동 실행 설정 (GitHub Actions)

워크플로: `.github/workflows/daily-brief.yml` — 매일 **07:00 KST(월~토, 일요일 제외)** + 수동 실행 버튼.

> ⚠️ **예약(cron) 실행은 기본 브랜치(main)에 워크플로가 있을 때만 작동합니다.** main에 머지 후 활성화됩니다.
> 머지 전에도 Actions 탭의 **Run workflow** 버튼으로 즉시 테스트할 수 있습니다.

### 1) Repo Secrets 등록
`Settings → Secrets and variables → Actions → New repository secret`

| 이름 | 값 |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic(Claude) API 키 |
| `GMAIL_USER` | 보내는 Gmail 주소 |
| `GMAIL_APP_PASSWORD` | Gmail **앱 비밀번호** ([발급](https://myaccount.google.com/apppasswords), 2단계 인증 필요) |
| `MAIL_TO` | 받는 주소(쉼표로 여러 명 가능) |

(선택) `Variables` 탭: `ANTHROPIC_MODEL`(기본 `claude-opus-4-8`), 그리고 C1 자동화용 `PDF_FROM_EMAIL`/`PDF_EMAIL_FROM`/`PDF_EMAIL_SUBJECT`.

### 2) 발송 시각/요일 변경
`daily-brief.yml` 의 `cron: "0 22 * * 0-5"` 수정. UTC 기준(07:00 KST = 22:00 UTC 전날), 요일 `0-5`는 UTC 일~금 = KST 월~토. 일요일까지 받으려면 `0-6`.

---

## 경로 C1 자동화 — 지면 PDF를 메일로 받아 자동 요약

내가 구독한 **모바일한경 지면 PDF**를 받은편지함에 들어오게 해두면, 파이프라인이 IMAP으로 그 첨부를 가져와 요약합니다(이미 등록한 Gmail 앱 비밀번호 그대로 사용).

**설정 방법(택1):**
- 매일 지면 PDF를 **본인 Gmail로 전송/자동전달**(모바일한경 앱의 공유 → 메일, 또는 메일 자동전달 규칙)
- 또는 지면 PDF가 오는 메일에 라벨을 두고 필터 활용

**활성화:** Variables(또는 `.env`)에 `PDF_FROM_EMAIL=1`. 필요하면 `PDF_EMAIL_FROM`(보낸사람)·`PDF_EMAIL_SUBJECT`(제목 포함)로 정확히 지정.
최근 18시간 내 매칭 메일이 없으면 자동으로 **RSS(경로 B)로 폴백**하므로, 설정해두면 "지면이 오면 지면, 없으면 RSS"로 동작합니다.

---

## 파일 구조

```
scripts/daily-brief/
├── run.js               # 오케스트레이터(CLI)
├── feeds.config.json    # 분야별 RSS 피드 목록
├── sample.brief.json    # --dry-run 미리보기용 샘플
└── lib/
    ├── fetchFeeds.js        # RSS 수집·파싱(경로 B)
    ├── fetchPdfFromEmail.js # 받은편지함 지면 PDF 자동수집(경로 C1)
    ├── ingestPdf.js         # 지면 PDF 텍스트 추출
    ├── summarize.js         # Claude(Anthropic) 분야별 요약
    ├── render.js            # Markdown / 이메일 HTML
    └── sendEmail.js         # Gmail SMTP 발송
public/briefs/           # 웹 뷰어 + 생성된 브리핑 JSON(자동 커밋)
.github/workflows/daily-brief.yml
```

## 비용·참고
- 요약 LLM은 **Claude `claude-opus-4-8`**(기본). 더 저렴하게 하려면 `ANTHROPIC_MODEL`을 `claude-sonnet-4-6` 또는 `claude-haiku-4-5`로.
- 피드 주소가 바뀌어 수집이 0건이면 `scripts/daily-brief/feeds.config.json` 의 `url` 을 <https://www.hankyung.com/feed> 에서 확인해 교체.
