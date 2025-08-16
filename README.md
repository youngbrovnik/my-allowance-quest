# My Allowance Quest 🎯

용돈을 목표로 하는 퀘스트(과제) 시스템을 통해 동기부여를 주는 React 웹 애플리케이션입니다.

## ✨ 주요 기능

- 🔐 **Google 로그인**: 구글 계정으로 간편하게 로그인
- 💰 **용돈 관리**: 월별 용돈 설정 및 편집
- 🎯 **퀘스트 시스템**: 개인 목표를 퀘스트로 등록하고 진행 상황 추적
- ☁️ **클라우드 동기화**: Firestore를 통한 데이터 저장으로 여러 기기에서 동기화
- 🎨 **다크/라이트 테마**: OS 설정에 따른 자동 테마 전환 및 수동 토글
- 📱 **완벽한 반응형**: 모바일과 데스크톱에서 최적화된 사용자 경험
- 🔄 **자동 초기화**: 월별 퀘스트 자동 리셋 및 진행률 관리

## 🛠️ 기술 스택

- **Frontend**: React 18.3.1
- **Authentication**: Firebase Authentication (Google 로그인)
- **Database**: Firestore Database
- **Styling**: CSS3 with CSS Variables & Media Queries
- **Build Tool**: Create React App
- **Deployment**: GitHub Pages

## 🚀 설치 및 실행

### 1. 저장소 클론

```bash
git clone https://github.com/youngbrovnik/my-allowance-quest.git
cd my-allowance-quest
```

### 2. 의존성 설치

```bash
npm install
```

### 3. Firebase 설정

#### Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication에서 Google 로그인 활성화:
   - Sign-in method > Google에서 활성화
   - 프로젝트 지원 이메일 설정
   - 승인된 도메인에 localhost 추가 (개발용)

#### 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 Firebase 설정을 추가:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 4. 개발 서버 실행

```bash
npm start
```

### 5. 프로덕션 빌드

```bash
npm run build
```

### 6. 배포

```bash
npm run deploy
```

## 📖 사용 방법

1. **Google 로그인**: 구글 계정으로 간편하게 로그인
2. **용돈 설정**: 월별 용돈 금액 설정 및 편집
3. **퀘스트 등록**: 달성하고 싶은 목표를 퀘스트로 등록 (빈도 설정 가능)
4. **진행 추적**: 퀘스트 완료 시마다 보상 획득 및 진행률 확인
5. **테마 전환**: 우측 상단 버튼으로 다크/라이트 테마 수동 전환
6. **데이터 동기화**: 다른 기기에서 로그인해도 최신 데이터 확인 가능

## 🎨 테마 시스템

### 다크 테마

- 배경: 순수한 검정 (#0a0a0a) → 회색 (#1a1a1a) → 밝은 회색 (#2a2a2a)
- 텍스트: 흰색 계열로 통일
- 강조색: 흰색으로 통일하여 모노톤 느낌 강화

### 라이트 테마

- 배경: 순수한 흰색 (#ffffff) → 연한 회색 (#f5f5f5) → 회색 (#e8e8e8)
- 텍스트: 검정 계열로 통일
- 강조색: 검정으로 통일하여 모노톤 느낌 강화

### 자동 테마 전환

- OS 설정의 `prefers-color-scheme` 미디어 쿼리 사용
- 실시간 OS 테마 변경 감지
- 부드러운 전환 애니메이션 (0.3초)

## 📱 반응형 디자인

### 브레이크포인트

- **모바일**: 768px 이하
- **작은 모바일**: 480px 이하
- **태블릿**: 769px ~ 1024px
- **데스크톱**: 1025px 이상

### 모바일 최적화

- 터치하기 쉬운 버튼 크기 (최소 44px)
- 적절한 여백과 간격
- 효율적인 공간 활용
- 스크롤 친화적 레이아웃

## 🏗️ 프로젝트 구조

```
src/
├── components/           # React 컴포넌트
│   ├── Allowance/       # 용돈 관리 컴포넌트
│   │   ├── Allowance.js
│   │   └── Allowance.css
│   ├── App/             # 메인 앱 컴포넌트
│   │   ├── App.js
│   │   ├── App.css
│   │   └── App.test.js
│   ├── Login/           # 로그인 컴포넌트
│   │   ├── Login.js
│   │   └── Login.css
│   ├── Quest/           # 퀘스트 관련 컴포넌트
│   │   ├── Quest.js
│   │   ├── Quest.css
│   │   └── QuestList.js
│   └── ThemeToggle/     # 테마 토글 컴포넌트
│       ├── ThemeToggle.js
│       └── ThemeToggle.css
├── config/              # 설정 파일
│   └── firebase.js      # Firebase 설정
├── contexts/            # React Context
│   └── ThemeContext.js  # 테마 상태 관리
├── hooks/               # 커스텀 훅
│   └── useQuestManager.js # 퀘스트 관리 로직
├── services/            # 서비스 레이어
│   └── firestoreService.js # Firestore 데이터 관리
├── styles/              # 전역 스타일
│   ├── index.css        # 메인 스타일
│   └── themes.css       # 테마별 CSS 변수
├── utils/               # 유틸리티 함수
│   └── questCalculations.js # 퀘스트 계산 로직
└── index.js             # 앱 진입점
```

## 🔧 핵심 로직

### 용돈 분배 시스템

```javascript
// 퀘스트당 할당 금액 = 총 용돈 ÷ 퀘스트 개수
// 1회당 획득 금액 = 퀘스트당 할당 금액 ÷ 퀘스트 빈도
// 최소 1000원 보장, 1000원 단위로 반올림
```

### 자동 재계산

- 퀘스트 추가/삭제 시 모든 퀘스트 재계산
- 용돈 변경 시 전체 시스템 재계산
- 월별 자동 초기화

## 🔒 보안

### Firestore 보안 규칙

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 사용자 데이터 격리

- Firebase Auth UID 기반 데이터 분리
- 사용자별 독립적인 데이터 저장
- 인증된 사용자만 데이터 접근 가능

## 🌐 배포

GitHub Pages를 통해 자동 배포됩니다:

- **URL**: https://youngbrovnik.github.io/my-allowance-quest/
- **배포 명령어**: `npm run deploy`
- **빌드 명령어**: `npm run build`

## 📊 성능 최적화

- **코드 스플리팅**: React.lazy를 통한 지연 로딩
- **CSS 최적화**: CSS 변수를 통한 효율적인 테마 전환
- **번들 최적화**: Webpack을 통한 프로덕션 빌드 최적화
- **이미지 최적화**: SVG 아이콘 사용으로 벡터 그래픽 활용

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🙏 감사의 말

- [React](https://reactjs.org/) - 웹 애플리케이션 개발을 위한 JavaScript 라이브러리
- [Firebase](https://firebase.google.com/) - 백엔드 서비스 및 인증 시스템
- [Create React App](https://create-react-app.dev/) - React 애플리케이션 개발 환경

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!
