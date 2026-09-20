# My Allowance Quest 🎯

용돈을 목표로 하는 퀘스트(과제) 시스템을 통해 동기부여를 주는 React 웹 애플리케이션입니다.

## ✨ 주요 기능

- 🔐 **Google 로그인**: 구글 계정으로 간편하게 로그인
- 💰 **용돈 관리**: 월별 용돈 설정 및 편집
- 🎯 **퀘스트 시스템**: 개인 목표를 퀘스트로 등록하고 진행 상황 추적
- 🖱️ **드래그 앤 드롭**: 퀘스트 순서를 자유롭게 변경하여 우선순위 관리
- 📊 **히스토리 페이지**: 과거 월별 퀀스트 완료 기록 및 통계 확인
- ☁️ **클라우드 동기화**: Firestore를 통한 데이터 저장으로 여러 기기에서 동기화
- 🎨 **다크/라이트 테마**: OS 설정에 따른 자동 테마 전환 및 수동 토글
- 📱 **완벽한 반응형**: 모바일과 데스크톱에서 최적화된 사용자 경험
- 🔄 **자동 초기화**: 월별 퀘스트 자동 리셋 및 진행률 관리

## 🛠️ 기술 스택

- **Frontend**: React 18.3.1
- **Authentication**: Firebase Authentication (Google 로그인)
- **Database**: Firestore Database
- **Drag & Drop**: react-beautiful-dnd
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
4. **순서 변경**: 드래그 앤 드롭으로 퀘스트 우선순위 조정
5. **진행 추적**: 퀘스트 완료 시마다 보상 획득 및 진행률 확인
6. **히스토리 확인**: 과거 월별 완료 기록 및 통계 확인
7. **테마 전환**: 우측 상단 버튼으로 다크/라이트 테마 수동 전환
8. **데이터 동기화**: 다른 기기에서 로그인해도 최신 데이터 확인 가능

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
│   ├── History/         # 히스토리 페이지 컴포넌트
│   │   ├── History.js
│   │   └── History.css
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
│   ├── questDate.js     # 퀘스트 날짜 계산
│   └── rewardModel.js   # 보상 데이터 검증 및 이전
└── index.js             # 앱 진입점
```

## 🔧 핵심 로직

### 퀘스트 보상 시스템

```javascript
// 퀘스트마다 완료 보상 금액을 직접 설정
// 퀘스트는 하루에 한 번 완료 가능
// 완료 시 보상 잔액에 즉시 적립
```

### 보상 목표와 기록

- 원하는 보상과 필요한 금액 설정
- 잔액이 충분하면 보상 사용
- 적립·사용 내역 확인 및 당일 완료/사용 취소
- 월별 자동 초기화

### 드래그 앤 드롭

- `react-beautiful-dnd` 라이브러리 사용
- 퀘스트 순서 변경 시 Firestore에 자동 저장
- 드래그 중 시각적 피드백 제공
- 히스토리에서도 변경된 순서로 표시

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
- **드래그 최적화**: react-beautiful-dnd의 최적화된 드래그 앤 드롭
- **데이터 캐싱**: Firestore 쿼리 최적화 및 클라이언트 사이드 정렬

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


## 배포 버전 확인

화면 하단에 앱 버전(현재 `v1.2.0`)이 표시됩니다. **배포 정보**를 펼치면
빌드 시각(한국 시간), 해당 빌드의 커밋 번호, 미커밋 변경 포함 여부를 확인할 수 있습니다.
로그인 전에도 확인할 수 있으며, 현재 열려 있는 화면의 빌드 정보를 표시합니다.

`npm run build`와 `npm run deploy` 실행 시 버전 정보가 자동으로 포함됩니다.
빌드 시각은 배포 완료 시각이 아니라 빌드를 시작한 시각입니다.

다음 수정 배포에서 버전을 올리려면:

```bash
npm version patch --no-git-tag-version
```

이 명령은 `package.json`과 `package-lock.json`의 버전만 올립니다.
변경 사항을 커밋·푸시한 후 `npm run deploy`를 실행하고, 사이트 하단의
버전과 커밋 번호가 이번 배포와 일치하는지 확인하세요.

## 고정 보상과 보상 목표

퀘스트마다 월 목표 일수와 1회 완료 보상을 직접 정합니다. 한국 시간 기준 하루 한 번 기록하며, 당일 완료는 취소할 수 있습니다. 보상 단가 수정·퀘스트 추가·삭제·정렬은 이미 적립한 금액을 변경하지 않습니다.

사용 가능한 잔액은 월이 바뀌어도 이월됩니다. 보상 목표 하나를 설정하고 실제 사용을 기록하면 잔액에서 차감합니다. 이번 달 사용 내역은 취소할 수 있습니다. 이미 사용한 적립을 취소해 잔액이 음수가 되는 동작은 차단합니다.

데이터 형식 `schemaVersion: 2`는 현재 잔액(`balance`), 이번 달 적립·사용(`earned`, `spent`), 목표(`rewardGoal`), 완료 당시 금액을 담은 월별 내역(`entries`)을 저장합니다. 월 전환 시 내역과 실적을 history 문서에 보관하고 월별 횟수와 내역만 초기화합니다. 잔액·목표·퀘스트별 단가는 유지합니다. 기존 revision 기반 저장 충돌 검사와 계정별 미저장 복구를 유지합니다.

이전 데이터는 현재 표시된 획득액을 시작 잔액으로 가져오고, 기존 1회 보상 단가와 완료 횟수를 유지합니다. 과거 월별 획득액을 잔액에 다시 합산하지 않습니다. 옛 기록에 없는 완료 날짜를 추정하지 않으며, 적립 당시 금액을 알 수 없는 구버전 당일 기록은 취소하지 않습니다. 실제 현금 지급·결제 기능은 없습니다.
