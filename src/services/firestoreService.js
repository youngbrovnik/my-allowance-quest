import { normalizeRewardData, periodStats } from "../utils/rewardModel";
import { getQuestMonth } from "../utils/questDate";
import { db } from "../config/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  getDocsFromServer,
  runTransaction,
} from "firebase/firestore";

// 사용자 데이터를 Firestore에 저장
export const saveUserData = async (userId, userData, baseData) => {
  try {
    if (baseData === undefined) throw new Error("저장 기준 데이터가 필요합니다.");
    const userRef = doc(db, "users", userId);
    return await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(userRef);
      const current = snapshot.exists() ? snapshot.data() : null;
      // 기존 문서는 revision이 없어도 마지막 저장일로 충돌을 감지합니다.
      if ((current?.schemaVersion === 2 && userData.schemaVersion !== 2) || Boolean(current) !== Boolean(baseData) || (current && (
        (current.revision || 0) !== (baseData.revision || 0) ||
        current.lastUpdated !== baseData.lastUpdated
      ))) {
        return { status: "conflict" };
      }
      transaction.set(userRef, {
        ...current,
        ...userData,
        revision: (current?.revision || 0) + 1,
        // 재시도하더라도 진행 상황이 속한 원래 월을 유지합니다.
        lastUpdated: userData.lastUpdated || new Date().toISOString(),
      });
      return true;
    });
  } catch (error) {
    console.error("사용자 데이터 저장 중 오류 발생:", error);
    return false;
  }
};

// 사용자 데이터를 Firestore에서 불러오기
export const loadUserData = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error("사용자 데이터 불러오기 중 오류 발생:", error);
    return false;
  }
};

// 사용자 데이터 업데이트
export const updateUserData = async (userId, updates) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...updates,
      lastUpdated: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("사용자 데이터 업데이트 중 오류 발생:", error);
    return false;
  }
};

// 특정 이메일로 사용자 찾기
export const findUserByEmail = async (email) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("사용자 검색 중 오류 발생:", error);
    return null;
  }
};

// 저장 시각·문서 ID를 제외하고 실제 월별 실적만 비교합니다.
const historyContents = (history) => JSON.stringify({
  allowance: history.allowance,
  totalEarned: history.totalEarned,
  quests: (history.quests || []).map((quest) => ({
    name: quest.name,
    frequency: quest.frequency,
    completedTimes: quest.completedTimes,
    completed: quest.completed,
    earnedPerCompletion: quest.earnedPerCompletion,
  })),
});

// 서버의 최신 데이터로 월별 기록과 초기화를 하나의 트랜잭션에서 처리합니다.
// 같은 월을 여러 기기에서 처리하거나 재시도해도 기록은 한 번만 생성됩니다.
export const rolloverMonthlyData = async (userId, now = new Date()) => {
  if (!userId) throw new Error("사용자 ID가 필요합니다.");
  const userRef = doc(db, "users", userId);
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    const periodDate = new Date(data.lastUpdated);
    if (!data.lastUpdated || Number.isNaN(periodDate.getTime())) {
      throw new Error("기록의 기준 날짜를 확인할 수 없습니다.");
    }
    const [year, month] = getQuestMonth(periodDate).split("-").map(Number);
    const currentPeriod = getQuestMonth(now);
    const savedPeriod = getQuestMonth(periodDate);
    if (savedPeriod === currentPeriod) return data;
    if (savedPeriod > currentPeriod) throw new Error("기록의 날짜가 현재보다 미래입니다.");

    // 이후의 월 기록과 초기화는 모두 검증·복구된 데이터만 사용합니다.
    const normalized = normalizeRewardData(data);
    const quests = normalized.quests;
    const historyRef = doc(db, "users", userId, "history", `${year}-${String(month).padStart(2, "0")}`);
    const hasActivity = quests.length || normalized.entries.length || normalized.earned || normalized.spent;
    const historySnapshot = hasActivity ? await transaction.get(historyRef) : null;
    const timestamp = now.toISOString();
    const updatedData = {
      ...normalized,
      revision: (data.revision || 0) + 1,
      quests: normalized.quests.map((quest) => ({ ...quest, completed: false, completedTimes: 0, lastCompletedDate: null })),
      earned: 0,
      spent: 0,
      entries: [],
      legacyCompletionCount: 0,
      lastUpdated: timestamp,
    };
    if (hasActivity && !historySnapshot.exists()) {
      const completedQuests = quests.filter((quest) => quest.completed).length;
      const monthHistory = {
        year, month,
        schemaVersion: 2,
        entries: normalized.entries,
        legacyCompletionCount: normalized.legacyCompletionCount || 0,
        activeDays: periodStats(normalized).activeDays,
        totalSpent: normalized.spent,
        closingBalance: normalized.balance,
        allowance: normalized.allowance || 0,
        quests,
        totalEarned: normalized.earned,
        completionRate: quests.length ? completedQuests / quests.length : 0,
        completedQuests,
        totalQuests: quests.length,
        createdAt: timestamp,
      };
      // 웹 SDK의 트랜잭션은 쿼리를 지원하지 않으므로 후보를 서버에서 조회한 뒤,
      // 각 문서를 트랜잭션 안에서 다시 읽어 수정·삭제 충돌을 감지합니다.
      const legacyQuery = query(
        collection(db, "users", userId, "history"),
        where("year", "==", year),
        where("month", "==", month)
      );
      const candidates = await getDocsFromServer(legacyQuery);
      let existingHistory = false;
      for (const candidate of candidates.docs) {
        const existing = await transaction.get(candidate.ref);
        if (!existing.exists()) continue;
        const record = existing.data();
        if (record.year !== year || record.month !== month) continue;
        if (historyContents(record) !== historyContents(monthHistory) || (record.schemaVersion === 2 && (JSON.stringify(record.entries || []) !== JSON.stringify(monthHistory.entries) || (record.totalSpent || 0) !== monthHistory.totalSpent))) {
          const error = new Error("같은 달에 내용이 다른 기존 기록이 있어 초기화를 중단했습니다.");
          error.code = "history-conflict";
          throw error;
        }
        existingHistory = true;
      }
      // 같은 실적이 이미 저장됐다면 구버전 ID를 그대로 유지합니다.
      if (!existingHistory) transaction.set(historyRef, monthHistory);
    }
    transaction.set(userRef, updatedData);
    return updatedData;
  });
};

// 월별 히스토리 불러오기
export const loadMonthlyHistory = async (userId, limitCount = null) => {
  try {
    if (!userId) {
      throw new Error("사용자 ID가 필요합니다.");
    }

    const historyRef = collection(db, "users", userId, "history");
    // orderBy를 제거하고 간단한 쿼리로 변경
    const q = query(historyRef);
    const querySnapshot = await getDocs(q);

    const history = [];
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // 클라이언트에서 정렬
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // limit 적용
    return limitCount === null ? history : history.slice(0, limitCount);
  } catch (error) {
    console.error("월별 히스토리 불러오기 중 오류 발생:", error);
    throw error;
  }
};

// 특정 월의 히스토리 불러오기 (month 필드가 제거되어 더 이상 사용 불가)
// export const loadHistoryByMonth = async (userId, year, month) => {
//   try {
//     if (!userId) {
//       throw new Error("사용자 ID가 필요합니다.");
//     }
//
//     const historyRef = collection(db, "users", userId, "history");
//
//     const q = query(historyRef, where("year", "==", year), where("month", "==", month));
//
//     const querySnapshot = await getDocs(q);
//
//     if (!querySnapshot.empty) {
//       const doc = querySnapshot.docs[0];
//       return {
//         id: doc.id,
//         ...doc.data(),
//       };
//     }
//     return null;
//   } catch (error) {
//     console.error("특정 월 히스토리 불러오기 중 오류 발생:", error);
//     return null;
//   }
// };
