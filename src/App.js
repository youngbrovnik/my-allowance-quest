import React, { useState, useEffect, useCallback } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { saveUserData, loadUserData } from "./services/firestoreService";
import "./App.css";
import Login from "./components/Login";
import Allowance from "./Allowance";
import QuestList from "./QuestList";

function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const [allowance, setAllowance] = useState(0);
  const [quests, setQuests] = useState([]);
  const [earned, setEarned] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Firebase 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setIsLoggedIn(true);
        // 사용자 데이터를 Firestore에서 불러오기
        const userData = await loadUserData(user.uid);
        console.log("Firestore에서 불러온 사용자 데이터:", userData);
        if (userData) {
          setAllowance(userData.allowance || 0);
          setQuests(userData.quests || []);
          setEarned(userData.earned || 0);
          setLastUpdated(new Date(userData.lastUpdated));
          console.log("상태 업데이트 완료:", {
            allowance: userData.allowance || 0,
            quests: userData.quests || [],
            earned: userData.earned || 0,
          });
        } else {
          console.log("사용자 데이터가 없습니다. 새 사용자로 간주합니다.");
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        // 로그아웃 시 로컬 상태 초기화
        setAllowance(0);
        setQuests([]);
        setEarned(0);
        setLastUpdated(new Date());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 사용자 데이터를 Firestore에 저장 (useCallback으로 최적화)
  const saveDataToFirestore = useCallback(
    async (data) => {
      if (user && isLoggedIn) {
        console.log("Firestore에 저장할 데이터:", data);
        const result = await saveUserData(user.uid, data);
        console.log("저장 결과:", result);
        return result;
      }
    },
    [user, isLoggedIn]
  );

  // 용돈 업데이트
  const updateAllowance = async (newAllowance) => {
    console.log("용돈 업데이트 시작:", { newAllowance, currentQuests: quests, currentEarned: earned });

    const updatedData = {
      allowance: newAllowance,
      quests: quests, // 현재 quests 상태 사용
      earned: 0, // 용돈 변경 시 획득 금액 초기화
      lastUpdated: new Date().toISOString(),
    };

    console.log("저장할 데이터:", updatedData);

    setAllowance(newAllowance);
    setEarned(0);

    const saveResult = await saveDataToFirestore(updatedData);
    console.log("용돈 업데이트 완료:", { newAllowance, saveResult });
  };

  // 퀘스트 업데이트
  const updateQuests = async (newQuests) => {
    setQuests(newQuests);
    await saveDataToFirestore({
      allowance,
      quests: newQuests,
      earned,
      lastUpdated: new Date().toISOString(),
    });
    console.log("Quests updated to:", newQuests);
  };

  // 획득한 용돈 업데이트
  const updateEarned = async (amount) => {
    const newEarned = earned + amount;
    setEarned(newEarned);
    await saveDataToFirestore({
      allowance,
      quests,
      earned: newEarned,
      lastUpdated: new Date().toISOString(),
    });
  };

  // 월별 자동 초기화
  useEffect(() => {
    if (!isLoggedIn) return;

    const now = new Date();
    if (now.getMonth() !== lastUpdated.getMonth()) {
      setEarned(0);
      const resetQuests = quests.map((quest) => ({
        ...quest,
        completed: false,
        completedTimes: 0,
      }));
      setQuests(resetQuests);
      setLastUpdated(new Date());

      // Firestore에 초기화된 데이터 저장
      saveDataToFirestore({
        allowance,
        quests: resetQuests,
        earned: 0,
        lastUpdated: new Date().toISOString(),
      });
    }
  }, [lastUpdated, quests, allowance, isLoggedIn, saveDataToFirestore]);

  if (loading) {
    return (
      <div className="App">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">My Allowance Quest</header>

      <Login onLogin={() => setIsLoggedIn(true)} isLoggedIn={isLoggedIn} user={user} />

      {isLoggedIn ? (
        <>
          <Allowance allowance={allowance} updateAllowance={updateAllowance} />
          <h2>Total Earned: {earned.toLocaleString()}</h2>
          <QuestList
            quests={quests}
            updateQuests={updateQuests}
            allowance={allowance}
            updateEarned={updateEarned}
            earned={earned}
            setEarned={setEarned}
          />
        </>
      ) : (
        <div className="login-prompt">
          <p>로그인하여 용돈 퀘스트를 시작하세요!</p>
        </div>
      )}
    </div>
  );
}

export default App;
