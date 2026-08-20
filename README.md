# 코코아 프론트엔드

부모와 아이의 마음을 잇는 AI 육아 지원 서비스입니다. 기존 TypeScript·Tailwind·Zustand 프로젝트를 React 19, JSX, 일반 CSS, Context 구조로 마이그레이션했습니다.

## 실행 환경

- Node.js 22.13 이상
- npm

```bash
npm install
cp .env.example .env
npm run dev
```

개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

## 환경 변수

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

- `VITE_API_BASE_URL`: 백엔드 API 주소입니다.

음성 대화는 백엔드가 로그인 사용자를 확인한 뒤 OpenAI Realtime 임시 자격 증명을 발급하는 방식으로 동작합니다. OpenAI 장기 API 키는 프론트 환경변수에 넣지 말고 백엔드 환경변수에만 보관해야 합니다.

Access Token은 브라우저 메모리에서 관리하고 Refresh Token은 HttpOnly 쿠키를 사용합니다. `/` 접속 시 세션을 복구한 뒤 로그인 또는 대시보드로 이동하며, 인증이 필요한 API가 401을 반환하면 refresh 후 한 번만 재시도합니다.

## 주요 경로

- `/login`, `/signup`: 로그인과 회원가입
- `/dashboard`: 아이 조회·선택·등록 및 프로필 이미지 업로드
- `/talk`: 선택한 아이와 음성 대화
- `/children/:childId/counseling`: 상담 목록과 새 상담 생성
- `/children/:childId/counseling/:sessionId`: 상담 분석 상세
- 그 외 경로: 404 화면

## 구조

- `src/api`: API 클라이언트와 도메인별 요청
- `src/context`, `src/hooks`: 인증·아이 선택 상태와 음성 대화 훅
- `src/pages`: 페이지별 JSX와 CSS
- `src/components`: 공통 레이아웃과 UI 컴포넌트
- `src/routes/router.jsx`: 전체 라우트와 접근 제어
- `src/styles`: 디자인 토큰, 전역 스타일, 공통 컴포넌트 스타일
- `src/utils`: 날짜·오류·음성 유틸리티

## 명령어

```bash
npm run dev
npm run lint
npm test
npm run build
npm run start
```
