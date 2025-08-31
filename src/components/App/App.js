import React, { useState, useEffect, useCallback } from "react";
import { auth } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { saveUserData, loadUserData, saveMonthlyHistory } from "../../services/firestoreService";
import { useQuestManager } from "../../hooks/useQuestManager";
import { ThemeProvider, useTheme } from "../../contexts/ThemeContext";
import "./App.css";
import Login from "../Login/Login";
import Allowance from "../Allowance/Allowance";
import QuestList from "../Quest/QuestList";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import History from "../History/History";

function AppContent() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowance, setAllowance] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentPage, setCurrentPage] = useState("main"); // 'main' 또는 'history'
  const { theme } = useTheme();

  // 사용자 데이터를 Firestore에 저장
  const saveDataToFirestore = useCallback(
    async (data) => {
      if (user && isLoggedIn) {
        return await saveUserData(user.uid, data);
      }
      return false;
    },
    [user, isLoggedIn]
  );

  // 월별 히스토리 저장 함수
  const saveMonthlyHistoryToFirestore = useCallback(
    async (monthData) => {
      if (user && isLoggedIn) {
        return await saveMonthlyHistory(user.uid, monthData);
      }
      return false;
    },
    [user, isLoggedIn]
  );

  // 퀘스트 매니저 훅 사용
  const questManager = useQuestManager(allowance, saveDataToFirestore, saveMonthlyHistoryToFirestore);

  // Firebase 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setIsLoggedIn(true);

        // 사용자 데이터를 Firestore에서 불러오기
        const userData = await loadUserData(user.uid);
        if (userData) {
          setAllowance(userData.allowance || 0);
          setLastUpdated(new Date(userData.lastUpdated));

          // 퀘스트 매니저 초기화
          questManager.setQuests(userData.quests || []);
          questManager.setEarned(userData.earned || 0);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        // 로그아웃 시 로컬 상태 초기화
        setAllowance(0);
        setLastUpdated(new Date());
        questManager.setQuests([]);
        questManager.setEarned(0);
        setCurrentPage("main");
      }
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 용돈 업데이트
  const updateAllowance = async (newAllowance) => {
    // 퀘스트 매니저를 통해 모든 퀘스트 재계산
    const { updatedQuests, recalculatedEarned } = questManager.recalculateQuestsForNewAllowance(newAllowance);

    const updatedData = {
      allowance: newAllowance,
      quests: updatedQuests,
      earned: recalculatedEarned,
      lastUpdated: new Date().toISOString(),
    };

    setAllowance(newAllowance);
    await saveDataToFirestore(updatedData);
  };

  // 월별 자동 초기화
  useEffect(() => {
    if (!isLoggedIn) return;

    const checkAndResetMonthly = () => {
      const now = new Date();
      const lastUpdatedDate = new Date(lastUpdated);

      // 월이 변경되었고, 아직 이번 달에 초기화하지 않았는지 확인
      if (now.getMonth() !== lastUpdatedDate.getMonth() || now.getFullYear() !== lastUpdatedDate.getFullYear()) {
        console.log("월별 리셋 실행:", {
          currentMonth: now.getMonth() + 1,
          currentYear: now.getFullYear(),
          lastMonth: lastUpdatedDate.getMonth() + 1,
          lastYear: lastUpdatedDate.getFullYear(),
        });

        questManager.resetQuests().then((resetQuests) => {
          setLastUpdated(new Date());

          // Firestore에 초기화된 데이터 저장
          saveDataToFirestore({
            allowance,
            quests: resetQuests,
            earned: 0,
            lastUpdated: new Date().toISOString(),
          });
        });
      }
    };

    // 컴포넌트 마운트 시 한 번만 체크
    checkAndResetMonthly();

    // 1분마다 체크 (월이 바뀌는 시점을 놓치지 않기 위해)
    const interval = setInterval(checkAndResetMonthly, 60000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, allowance, saveDataToFirestore, questManager]); // lastUpdated 의존성 제거

  // 페이지 전환 함수
  const navigateToPage = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="App" data-theme={theme}>
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="App" data-theme={theme}>
      <ThemeToggle />
      <header className="App-header">
        <div className="header-content">
          <h1 className="header-title">My Allowance Quest</h1>
          <div className="header-auth">
            <Login onLogin={() => setIsLoggedIn(true)} isLoggedIn={isLoggedIn} user={user} />
          </div>
        </div>
      </header>

      {isLoggedIn ? (
        <>
          {/* 네비게이션 */}
          <nav className="app-navigation">
            <button
              className={`nav-btn ${currentPage === "main" ? "active" : ""}`}
              onClick={() => navigateToPage("main")}
            >
              🎯 퀘스트
            </button>
            <button
              className={`nav-btn ${currentPage === "history" ? "active" : ""}`}
              onClick={() => navigateToPage("history")}
            >
              📊 히스토리
            </button>
          </nav>

          {/* 메인 콘텐츠 */}
          <main className="main-content">
            {currentPage === "main" ? (
              <>
                <Allowance allowance={allowance} updateAllowance={updateAllowance} />
                <h2>Total Earned: {questManager.earned.toLocaleString()}</h2>
                <QuestList
                  quests={questManager.quests}
                  addQuest={questManager.addQuest}
                  removeQuest={questManager.removeQuest}
                  toggleComplete={questManager.toggleQuestComplete}
                  allowance={allowance}
                />
              </>
            ) : (
              <History />
            )}
          </main>
        </>
      ) : (
        <div className="login-prompt">
          <p>로그인하여 용돈 퀘스트를 시작하세요!</p>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
