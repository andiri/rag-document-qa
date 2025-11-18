# GitHub 푸시 가이드

## 방법 1: GitHub CLI 사용 (추천)

### 1. GitHub CLI 설치 확인
```bash
gh --version
```

설치되지 않았다면:
```bash
# macOS
brew install gh

# 로그인
gh auth login
```

### 2. 저장소 생성 및 푸시
```bash
cd rag-document-qa

# GitHub에 저장소 생성 및 자동 푸시
gh repo create rag-document-qa --public --source=. --push

# 또는 private 저장소로
gh repo create rag-document-qa --private --source=. --push
```

---

## 방법 2: GitHub 웹사이트 사용

### 1. GitHub에서 새 저장소 생성

1. https://github.com/new 방문
2. Repository name: `rag-document-qa`
3. Description: `RAG-powered document Q&A application with OpenAI GPT-4`
4. Public 또는 Private 선택
5. **❌ README, .gitignore, license 추가하지 않기** (이미 있음)
6. "Create repository" 클릭

### 2. 로컬 저장소 연결 및 푸시

GitHub에서 제공하는 명령어를 복사하거나 아래 명령어 사용:

```bash
cd rag-document-qa

# 원격 저장소 추가 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/rag-document-qa.git

# 또는 SSH 사용
git remote add origin git@github.com:YOUR_USERNAME/rag-document-qa.git

# 브랜치 이름 확인 및 변경 (필요시)
git branch -M main

# 푸시
git push -u origin main
```

---

## 방법 3: GitHub Desktop 사용

1. GitHub Desktop 열기
2. File → Add Local Repository
3. `rag-document-qa` 폴더 선택
4. "Publish repository" 클릭
5. 저장소 이름 및 공개/비공개 설정
6. "Publish Repository" 클릭

---

## 푸시 후 확인사항

### ✅ 체크리스트

푸시가 완료되면 GitHub 저장소에서 확인:

- [ ] 모든 파일이 업로드되었는지 확인
- [ ] README.md가 제대로 표시되는지 확인
- [ ] .env 파일이 **없는지** 확인 (보안)
- [ ] .env.example 파일이 있는지 확인

### 📁 예상 파일 구조

```
rag-document-qa/
├── .gitignore
├── CHANGELOG.md
├── DEPLOYMENT.md
├── GITHUB_SETUP.md
├── PROJECT_SUMMARY.md
├── QUICKSTART.md
├── README.md
├── TROUBLESHOOTING.md
├── package.json
├── vercel.json
├── vite.config.js
├── postcss.config.js
├── .env.example          ✅ 있어야 함
├── .env                  ❌ 없어야 함 (gitignore됨)
├── src/
│   ├── components/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
└── public/
```

---

## 저장소 설정 (푸시 후)

### 1. About 섹션 설정

GitHub 저장소 페이지에서:
1. ⚙️ (Settings) 옆의 About 섹션 편집
2. Description 추가:
   ```
   RAG-powered document Q&A application with OpenAI GPT-4 and Embeddings
   ```
3. Website 추가 (Vercel 배포 후)
4. Topics 추가:
   - `rag`
   - `openai`
   - `gpt-4`
   - `embeddings`
   - `react`
   - `vite`
   - `tailwindcss`
   - `document-qa`
   - `vector-search`

### 2. README 배지 추가 (선택사항)

README.md 상단에 추가:

```markdown
# RAG Document Q&A Application

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/rag-document-qa)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-green.svg)](https://openai.com/)
```

---

## 다음 단계

### 1. Vercel 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

또는 GitHub 연동:
1. https://vercel.com/new 방문
2. GitHub 저장소 import
3. 환경 변수 설정: `VITE_OPENAI_API_KEY`
4. Deploy 클릭

### 2. 저장소 보호 설정

Settings → Branches:
- Branch protection rule 추가
- `main` 브랜치 보호
- Require pull request reviews

### 3. Issues 템플릿 추가

`.github/ISSUE_TEMPLATE/bug_report.md` 생성

---

## 문제 해결

### "remote origin already exists"

```bash
# 기존 원격 저장소 제거
git remote remove origin

# 새로 추가
git remote add origin https://github.com/YOUR_USERNAME/rag-document-qa.git
```

### "Permission denied (publickey)"

SSH 키 설정 필요:
```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "your_email@example.com"

# SSH 키를 GitHub에 추가
cat ~/.ssh/id_ed25519.pub
# 출력된 키를 GitHub Settings → SSH Keys에 추가
```

### "Updates were rejected"

```bash
# 강제 푸시 (주의: 원격 변경사항 덮어씀)
git push -f origin main
```

---

## 협업 설정

### Contributors 추가

Settings → Collaborators → Add people

### Branch 전략

```bash
# 개발 브랜치 생성
git checkout -b develop
git push -u origin develop

# 기능 브랜치
git checkout -b feature/new-feature
```

---

## 유용한 Git 명령어

```bash
# 현재 상태 확인
git status

# 커밋 히스토리
git log --oneline

# 원격 저장소 확인
git remote -v

# 최신 변경사항 가져오기
git pull origin main

# 브랜치 목록
git branch -a
```

---

**준비 완료!** 위 방법 중 하나를 선택하여 GitHub에 푸시하세요.
