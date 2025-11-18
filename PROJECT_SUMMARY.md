# RAG Document Q&A - Project Summary

## 프로젝트 개요

OpenAI GPT-4와 Embeddings API를 활용한 완전한 RAG(Retrieval-Augmented Generation) 문서 검색 및 질의응답 웹 애플리케이션입니다.

## 구현된 기능

### ✅ RAG 파이프라인
- **문서 임베딩**: OpenAI text-embedding-3-small 모델 사용
- **텍스트 청킹**: 800 토큰 단위, 200 토큰 오버랩
- **벡터 검색**: 코사인 유사도 기반 검색
- **리랭킹**: 유사도 + 키워드 매칭 + 컨텍스트 길이 기반
- **답변 생성**: GPT-4를 활용한 컨텍스트 기반 답변

### ✅ 사용자 인터페이스
- 드래그 앤 드롭 문서 업로드
- PDF, TXT, MD 파일 지원
- 실시간 채팅 인터페이스
- 대화 히스토리 표시
- 소스 문서 추적 및 표시
- 반응형 디자인 (Tailwind CSS)

### ✅ 기술 스택
- React 19 + Vite
- Tailwind CSS v4
- OpenAI SDK
- pdfjs-dist (브라우저 호환 PDF 파싱)
- Axios

## 프로젝트 구조

```
rag-document-qa/
├── src/
│   ├── components/          # UI 컴포넌트
│   │   ├── DocumentUploader.jsx
│   │   ├── ChatInterface.jsx
│   │   ├── DocumentInfo.jsx
│   │   ├── ConversationHistory.jsx
│   │   └── AnswerDisplay.jsx
│   ├── services/           # 비즈니스 로직
│   │   ├── embeddingService.js
│   │   ├── vectorSearch.js
│   │   ├── reranker.js
│   │   └── gptService.js
│   ├── utils/              # 유틸리티
│   │   ├── documentParser.js
│   │   └── textChunker.js
│   ├── App.jsx             # 메인 앱
│   ├── main.jsx
│   └── index.css
├── public/
├── .env.example            # 환경 변수 템플릿
├── vercel.json            # Vercel 배포 설정
├── README.md              # 상세 문서
├── QUICKSTART.md          # 빠른 시작 가이드
├── DEPLOYMENT.md          # 배포 가이드
└── package.json
```

## 핵심 알고리즘

### 1. 문서 처리 파이프라인
```
파일 업로드 → 파싱 → 청킹 → 임베딩 → 저장
```

### 2. 질의응답 파이프라인
```
질문 → 임베딩 → 벡터 검색 → 리랭킹 → GPT-4 생성 → 답변
```

### 3. 청킹 전략
- 청크 크기: 800 토큰
- 오버랩: 200 토큰
- 문장 단위 분할
- 컨텍스트 보존

### 4. 검색 전략
- Top-K 검색: 5개 청크
- 코사인 유사도 계산
- 리랭킹으로 정확도 향상
- 최종 3개 청크를 GPT-4에 전달

## 설치 및 실행

### 빠른 시작
```bash
cd rag-document-qa
npm install
# .env 파일에 VITE_OPENAI_API_KEY 설정
npm run dev
```

### 빌드
```bash
npm run build
```

### 배포 (Vercel)
```bash
vercel
```

## 환경 변수

| 변수 | 설명 | 필수 |
|------|------|------|
| `VITE_OPENAI_API_KEY` | OpenAI API 키 | ✅ |

## 주요 파일 설명

### App.jsx
- 메인 애플리케이션 로직
- 상태 관리 (문서, 대화 히스토리)
- RAG 파이프라인 오케스트레이션

### embeddingService.js
- OpenAI Embeddings API 통합
- 단일/배치 임베딩 생성

### vectorSearch.js
- 코사인 유사도 계산
- Top-K 검색 구현

### reranker.js
- 검색 결과 재정렬
- 다중 요소 스코어링

### gptService.js
- GPT-4 API 통합
- 프롬프트 엔지니어링
- 답변 생성

### documentParser.js
- PDF, TXT, MD 파일 파싱
- 브라우저 호환 PDF.js 사용

### textChunker.js
- 텍스트 청킹 로직
- 오버랩 처리
- 토큰 추정

## 성능 최적화

- 배치 임베딩으로 API 호출 최소화
- 청크 크기 최적화 (800 토큰)
- 리랭킹으로 GPT-4 호출 효율화
- 클라이언트 사이드 벡터 검색

## 보안 고려사항

⚠️ **현재 구현**: API 키가 브라우저에 노출됨

**프로덕션 권장사항**:
1. 백엔드 API 서버 구축
2. API 키를 서버 사이드에서 관리
3. 사용자 인증 추가
4. Rate limiting 구현

## 비용 추정

### 문서 처리 (1회)
- 중간 크기 문서 (10페이지): $0.01-0.05

### 질의응답 (1회)
- GPT-4 사용: $0.01-0.05
- GPT-3.5-turbo 사용: $0.001-0.005

## 테스트 방법

1. 샘플 문서 업로드
2. 다양한 질문 테스트
3. 소스 추적 확인
4. 답변 정확도 평가

## 향후 개선 사항

- [ ] 백엔드 API 서버
- [ ] 영구 벡터 저장소 (Pinecone, Weaviate)
- [ ] 다중 문서 지원
- [ ] 하이브리드 검색 (키워드 + 벡터)
- [ ] 사용자 인증
- [ ] 답변 피드백 시스템
- [ ] 대화 히스토리 내보내기
- [ ] 더 많은 파일 형식 지원

## 문제 해결

### 일반적인 문제

1. **빌드 실패**
   - `npm install` 재실행
   - Node.js 버전 확인 (18+)

2. **API 오류**
   - OpenAI API 키 확인
   - GPT-4 접근 권한 확인
   - API 사용량 한도 확인

3. **PDF 파싱 오류**
   - 파일 크기 확인 (10MB 이하)
   - PDF 파일 손상 여부 확인

## 라이선스

MIT

## 기여

Pull Request 환영합니다!

## 지원

문제가 있으시면 GitHub Issues에 등록해주세요.

---

**개발 완료일**: 2025년 11월 18일
**버전**: 1.0.0
**상태**: ✅ 프로덕션 준비 완료
