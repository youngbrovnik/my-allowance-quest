import React, { useState, useEffect, useCallback, useRef } from "react";
import { auth } from "../../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { saveUserData, loadUserData, rolloverMonthlyData } from "../../services/firestoreService";
import { useQuestManager } from "../../hooks/useQuestManager";
import { ThemeProvider, useTheme } from "../../contexts/ThemeContext";
import "./App.css";
import Login from "../Login/Login";
import Allowance from "../Allowance/Allowance";
import QuestList from "../Quest/QuestList";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import History from "../History/History";
import BuildInfo from "../BuildInfo/BuildInfo";
import { isValidAllowance } from "../../utils/inputValidation";

function AppContent() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataReady, setDataReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const loadVersion = useRef(0);
  const loadedUserId = useRef(null);
  const saveVersion = useRef(0);
  const pendingSaves = useRef(new Map());
  const saveQueues = useRef(new Map());
  const savedSnapshots = useRef(new Map());
  const conflictedUsers = useRef(new Set());
  const [saveConflict, setSaveConflict] = useState(false);
  // 계정별 최신 미저장 변경을 보관합니다. 저장 성공 전에는 제거하지 않습니다.
  const unsavedChanges = useRef(new Map());
  const [retryingSave, setRetryingSave] = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [allowance, setAllowance] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentPage, setCurrentPage] = useState("main"); // 'main' 또는 'history'
  const { theme } = useTheme();

  // 사용자 데이터를 Firestore에 저장
  const saveDataToFirestore = useCallback(
    async (data) => {
      if (!user || !isLoggedIn || loadedUserId.current !== user.uid) return false;

      const version = loadVersion.current;
      const attempt = ++saveVersion.current;
      const draft = { ...data };
      unsavedChanges.current.set(user.uid, draft);
      let saved = false;
      try {
        // 같은 계정의 저장을 순서대로 처리하여 연속 편집끼리 충돌하지 않게 합니다.
        const previous = saveQueues.current.get(user.uid) || Promise.resolve();
        const pending = previous.then(async () => {
          if (conflictedUsers.current.has(user.uid)) return false;
          const base = savedSnapshots.current.get(user.uid);
          const result = await saveUserData(user.uid, data, base);
          if (result?.status === "conflict") conflictedUsers.current.add(user.uid);
          if (result === true) {
            savedSnapshots.current.set(user.uid, { ...base, ...data, revision: (base?.revision || 0) + 1 });
          }
          return result === true;
        });
        saveQueues.current.set(user.uid, pending.catch(() => false));
        pendingSaves.current.set(pending, user.uid);
        try {
          saved = (await pending) === true;
        } finally {
          pendingSaves.current.delete(pending);
        }
      } catch (error) {
        console.error("사용자 데이터 저장 중 오류 발생:", error);
      }
      if (saved && unsavedChanges.current.get(user.uid) === draft) {
        unsavedChanges.current.delete(user.uid);
      }
      if (version === loadVersion.current && attempt === saveVersion.current) {
        setSaveConflict(conflictedUsers.current.has(user.uid));
        setSaveError(saved ? "" : "변경 내용을 저장하지 못했습니다. 다시 저장해주세요. 저장 전까지 월별 초기화를 보류합니다.");
      }
      return saved;
    },
    [user, isLoggedIn]
  );

  const questManager = useQuestManager(allowance, saveDataToFirestore);

  const { setQuests, setEarned } = questManager;

  // 요청 번호를 확인하여 계정 변경 전의 응답이 현재 데이터를 덮어쓰지 않도록 합니다.
  const loadDataForUser = useCallback(async (currentUser, discardDraft = false) => {
    const pendingForUser = [...pendingSaves.current].filter(([, uid]) => uid === currentUser.uid).map(([pending]) => pending);
    if (!discardDraft && loadedUserId.current === currentUser.uid && unsavedChanges.current.has(currentUser.uid) && pendingForUser.length === 0) {
      setSaveError("변경 내용을 저장하지 못했습니다. 다시 저장해주세요. 저장 전까지 월별 초기화를 보류합니다.");
      return;
    }
    const version = ++loadVersion.current;
    loadedUserId.current = null;
    setDataReady(false);
    setLoading(true);
    setMonthlyLoading(false);
    setRetryingSave(false);
    setLoadError("");
    setSaveError("");
    setSaveConflict(false);
    setAllowance(0);
    setLastUpdated(new Date());
    setQuests([]);
    setEarned(0);

    try {
      // 이미 시작한 저장을 마친 후 서버 상태를 읽고 월을 전환합니다.
      await Promise.allSettled(pendingForUser);
      if (version !== loadVersion.current) return;
      const draft = unsavedChanges.current.get(currentUser.uid);
      if (draft && !discardDraft) {
        setSaveConflict(conflictedUsers.current.has(currentUser.uid));
        setAllowance(draft.allowance);
        setLastUpdated(new Date(draft.lastUpdated));
        setQuests(draft.quests);
        setEarned(draft.earned);
        loadedUserId.current = currentUser.uid;
        setDataReady(true);
        setSaveError("변경 내용을 저장하지 못했습니다. 다시 저장해주세요. 저장 전까지 월별 초기화를 보류합니다.");
        return;
      }
      let userData = await loadUserData(currentUser.uid);
      if (version !== loadVersion.current) return;
      // null만 신규 사용자입니다. 읽기 실패(false)는 빈 데이터로 취급하지 않습니다.
      if (userData === false || userData === undefined) {
        throw new Error("사용자 데이터를 불러오지 못했습니다.");
      }
      if (userData !== null) {
        const savedDate = new Date(userData.lastUpdated);
        const now = new Date();
        if (Number.isNaN(savedDate.getTime()) || savedDate.getFullYear() !== now.getFullYear() || savedDate.getMonth() !== now.getMonth()) {
          setMonthlyLoading(true);
          userData = await rolloverMonthlyData(currentUser.uid, now);
          if (version !== loadVersion.current) return;
          if (!userData) throw new Error("초기화할 데이터를 찾을 수 없습니다.");
        }
        setAllowance(userData.allowance || 0);
        setLastUpdated(new Date(userData.lastUpdated));
        setQuests(userData.quests || []);
        setEarned(userData.earned || 0);
      }
      savedSnapshots.current.set(currentUser.uid, userData);
      if (discardDraft) {
        unsavedChanges.current.delete(currentUser.uid);
        conflictedUsers.current.delete(currentUser.uid);
      }
      loadedUserId.current = currentUser.uid;
      setDataReady(true);
    } catch (error) {
      if (version === loadVersion.current) {
        setLoadError(error.code === "history-conflict"
          ? "같은 달에 내용이 다른 기존 기록이 있습니다. 기록을 확인할 때까지 초기화를 중단하고 기존 데이터를 유지합니다."
          : "데이터를 불러오지 못했습니다. 불러오기 또는 월별 저장에 실패하여 편집과 저장을 중단했습니다. 기존 기록을 보호하기 위해 다시 시도해주세요.");
      }
    } finally {
      if (version === loadVersion.current) {
        setLoading(false);
        setMonthlyLoading(false);
      }
    }
  }, [setQuests, setEarned]);

  const retrySave = async () => {
    if (!user || retryingSave) return;
    const draft = unsavedChanges.current.get(user.uid);
    if (!draft) return;
    const version = loadVersion.current;
    setRetryingSave(true);
    const saved = await saveDataToFirestore(draft);
    if (version !== loadVersion.current) return;
    setRetryingSave(false);
    if (saved && !unsavedChanges.current.has(user.uid)) {
      const period = new Date(draft.lastUpdated);
      const now = new Date();
      if (period.getFullYear() !== now.getFullYear() || period.getMonth() !== now.getMonth()) {
        await loadDataForUser(user);
      }
    }
  };

  const invalidateLoad = useCallback(() => {
    ++loadVersion.current;
    loadedUserId.current = null;
  }, []);

  // Firebase 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoggedIn(Boolean(currentUser));
      setCurrentPage("main");
      if (currentUser) {
        loadDataForUser(currentUser);
      } else {
        invalidateLoad();
        setDataReady(false);
        setLoadError("");
        setSaveError("");
        setSaveConflict(false);
        setRetryingSave(false);
        setAllowance(0);
        setLastUpdated(new Date());
        setQuests([]);
        setEarned(0);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      invalidateLoad();
    };
  }, [loadDataForUser, invalidateLoad, setQuests, setEarned]);

  const canEdit = () => {
    if (!dataReady || !user || loadedUserId.current !== user.uid || conflictedUsers.current.has(user.uid)) return false;
    const now = new Date();
    if (now.getMonth() !== lastUpdated.getMonth() || now.getFullYear() !== lastUpdated.getFullYear()) {
      loadDataForUser(user);
      return false;
    }
    return true;
  };

  // 용돈 업데이트
  const updateAllowance = async (newAllowance) => {
    if (!canEdit() || !isValidAllowance(newAllowance)) return;
    newAllowance = Number(newAllowance);
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

  // 앱을 열어둔 채 월이 바뀌어도 편집을 잠근 뒤 서버에서 월 전환을 처리합니다.
  useEffect(() => {
    if (!isLoggedIn || !dataReady || !user) return;
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getMonth() !== lastUpdated.getMonth() || now.getFullYear() !== lastUpdated.getFullYear()) {
        loadDataForUser(user);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn, dataReady, user, lastUpdated, loadDataForUser]);

  // 페이지 전환 함수
  const navigateToPage = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="App" data-theme={theme}>
        <div className="loading" role="status">{monthlyLoading ? "월별 기록을 저장하고 있습니다..." : "로딩 중..."}</div>
        <BuildInfo />
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

      {isLoggedIn && loadError ? (
        <div role="alert" className="error-message">
          <p>{loadError}</p>
          <button onClick={() => loadDataForUser(user)}>다시 불러오기</button>
        </div>
      ) : isLoggedIn && dataReady ? (
        <>
          {saveError && (
            <div role="alert" className="error-message">
              {saveConflict ? (
                <>
                  <p>다른 기기에서 기록이 변경되어 저장을 중단했습니다. 현재 화면의 내 변경은 아직 저장되지 않았습니다.</p>
                  <button onClick={() => loadDataForUser(user, true)}>내 변경을 버리고 최신 기록 불러오기</button>
                </>
              ) : (
                <>
                  <p>{saveError}</p>
                  <button onClick={retrySave} disabled={retryingSave}>
                    {retryingSave ? "저장 중..." : "다시 저장"}
                  </button>
                </>
              )}
            </div>
          )}
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
              <fieldset disabled={saveConflict} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                <Allowance allowance={allowance} updateAllowance={updateAllowance} />
                <h2>Total Earned: {questManager.earned.toLocaleString()}</h2>
                <QuestList
                  quests={questManager.quests}
                  addQuest={(...args) => canEdit() && questManager.addQuest(...args)}
                  removeQuest={(...args) => canEdit() && questManager.removeQuest(...args)}
                  toggleComplete={(...args) => canEdit() && questManager.toggleQuestComplete(...args)}
                  reorderQuests={(...args) => canEdit() && questManager.reorderQuests(...args)}
                  allowance={allowance}
                />
              </fieldset>
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
      <BuildInfo />
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
