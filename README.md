# My Allowance Quest

용돈을 목표로 하는 퀘스트(과제) 시스템을 통해 동기부여를 주는 React 웹 애플리케이션입니다.

## 주요 기능

- 🔐 **Google 로그인**: 구글 계정으로 간편하게 로그인
- 💰 **용돈 관리**: 월별 용돈 설정 및 편집
- 🎯 **퀘스트 시스템**: 개인 목표를 퀘스트로 등록하고 진행 상황 추적
- ☁️ **클라우드 동기화**: Firestore를 통한 데이터 저장으로 여러 기기에서 동기화
- 📱 **반응형 디자인**: 모바일과 데스크톱에서 모두 사용 가능

## 기술 스택

- React 18.3.1
- Firebase Authentication (Google 로그인)
- Firestore Database
- Create React App

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 설정

#### Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Authentication에서 Google 로그인 활성화:
   - Sign-in method > Google에서 활성화
   - 프로젝트 지원 이메일 설정
   - 승인된 도메인에 localhost 추가 (개발용)

#### Google 로그인 설정

1. Authentication > Sign-in method > Google에서 활성화
2. 프로젝트 지원 이메일 설정
3. 승인된 도메인에 localhost 추가 (개발용)
4. OAuth 2.0 클라이언트 ID 생성

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

### 3. 개발 서버 실행

```bash
npm start
```

### 4. 프로덕션 빌드

```bash
npm run build
```

### 5. 배포

```bash
npm run deploy
```

## 사용 방법

1. **Google 로그인**: 구글 계정으로 간편하게 로그인
2. **용돈 설정**: 월별 용돈 금액 설정
3. **퀘스트 등록**: 달성하고 싶은 목표를 퀘스트로 등록
4. **진행 추적**: 퀘스트 완료 시마다 보상 획득
5. **데이터 동기화**: 다른 기기에서 로그인해도 최신 데이터 확인 가능

## 로그인 방식

### Google 로그인

- 구글 계정으로 간편 로그인
- 별도 회원가입 과정 없이 바로 사용 가능
- 기존 구글 계정과 연동
- 보안성이 높고 사용자 편의성 우수

## Firestore 보안 규칙

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

## 프로젝트 구조

```
src/
├── components/
│   ├── Login.js          # Google 로그인 컴포넌트
│   └── Login.css         # 로그인 스타일
├── services/
│   └── firestoreService.js # Firestore 데이터 관리 서비스
├── firebase.js           # Firebase 설정
├── App.js               # 메인 앱 컴포넌트
├── Allowance.js         # 용돈 관리 컴포넌트
├── Quest.js             # 개별 퀘스트 컴포넌트
├── QuestList.js         # 퀘스트 목록 관리
└── App.css              # 메인 스타일
```

## 배포

GitHub Pages를 통해 자동 배포됩니다:

- **URL**: https://youngbrovnik.github.io/my-allowance-quest/

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
