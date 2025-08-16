import { db } from "../config/firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

// 사용자 데이터를 Firestore에 저장
export const saveUserData = async (userId, userData) => {
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      ...userData,
      lastUpdated: new Date().toISOString(),
    });
    return true;
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

// 월별 히스토리 저장
export const saveMonthlyHistory = async (userId, monthData) => {
  try {
    if (!userId) {
      throw new Error("사용자 ID가 필요합니다.");
    }

    const historyRef = collection(db, "users", userId, "history");
    await addDoc(historyRef, {
      ...monthData,
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("월별 히스토리 저장 중 오류 발생:", error);
    return false;
  }
};

// 월별 히스토리 불러오기
export const loadMonthlyHistory = async (userId, limitCount = 12) => {
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
    return history.slice(0, limitCount);
  } catch (error) {
    console.error("월별 히스토리 불러오기 중 오류 발생:", error);
    return [];
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

// 테스트용 가짜 히스토리 데이터 생성 및 저장
export const generateTestHistory = async (userId) => {
  try {
    if (!userId) {
      throw new Error("사용자 ID가 필요합니다.");
    }

    const historyRef = collection(db, "users", userId, "history");

    // 기존 테스트 데이터가 있는지 확인
    const existingData = await getDocs(historyRef);
    if (!existingData.empty) {
      console.log("이미 테스트 데이터가 존재합니다.");
      return true;
    }

    // 가짜 데이터 생성
    const testData = [
      {
        month: 10, // 10월
        year: 2024, // 2024년
        allowance: 100000,
        quests: [
          { name: "숙제하기", frequency: 20, completedTimes: 18, completed: true, earnedPerCompletion: 5000 },
          { name: "방 정리하기", frequency: 15, completedTimes: 12, completed: false, earnedPerCompletion: 6667 },
          { name: "독서하기", frequency: 10, completedTimes: 10, completed: true, earnedPerCompletion: 10000 },
          { name: "운동하기", frequency: 8, completedTimes: 6, completed: false, earnedPerCompletion: 12500 },
          { name: "일기쓰기", frequency: 5, completedTimes: 5, completed: true, earnedPerCompletion: 20000 },
        ],
        totalEarned: 85000,
        completionRate: 0.6,
        completedQuests: 3,
        totalQuests: 5,
        createdAt: new Date(2024, 10, 0, 23, 59, 59).toISOString(), // 10월 31일 23:59:59
      },
      {
        month: 9, // 9월
        year: 2024, // 2024년
        allowance: 80000,
        quests: [
          { name: "숙제하기", frequency: 20, completedTimes: 20, completed: true, earnedPerCompletion: 4000 },
          { name: "방 정리하기", frequency: 15, completedTimes: 15, completed: true, earnedPerCompletion: 5333 },
          { name: "독서하기", frequency: 10, completedTimes: 8, completed: false, earnedPerCompletion: 8000 },
          { name: "운동하기", frequency: 8, completedTimes: 8, completed: true, earnedPerCompletion: 10000 },
        ],
        totalEarned: 72000,
        completionRate: 0.75,
        completedQuests: 3,
        totalQuests: 4,
        createdAt: new Date(2024, 9, 0, 23, 59, 59).toISOString(), // 9월 30일 23:59:59
      },
      {
        month: 8, // 8월
        year: 2024, // 2024년
        allowance: 120000,
        quests: [
          { name: "숙제하기", frequency: 20, completedTimes: 15, completed: false, earnedPerCompletion: 6000 },
          { name: "방 정리하기", frequency: 15, completedTimes: 10, completed: false, earnedPerCompletion: 8000 },
          { name: "독서하기", frequency: 10, completedTimes: 10, completed: true, earnedPerCompletion: 12000 },
          { name: "운동하기", frequency: 8, completedTimes: 8, completed: true, earnedPerCompletion: 15000 },
          { name: "일기쓰기", frequency: 5, completedTimes: 3, completed: false, earnedPerCompletion: 24000 },
          { name: "악기 연습", frequency: 12, completedTimes: 8, completed: false, earnedPerCompletion: 10000 },
        ],
        totalEarned: 65000,
        completionRate: 0.33,
        completedQuests: 2,
        totalQuests: 6,
        createdAt: new Date(2024, 8, 0, 23, 59, 59).toISOString(), // 8월 31일 23:59:59
      },
      {
        month: 7, // 7월
        year: 2024, // 2024년
        allowance: 90000,
        quests: [
          { name: "숙제하기", frequency: 20, completedTimes: 20, completed: true, earnedPerCompletion: 4500 },
          { name: "방 정리하기", frequency: 15, completedTimes: 15, completed: true, earnedPerCompletion: 6000 },
          { name: "독서하기", frequency: 10, completedTimes: 10, completed: true, earnedPerCompletion: 9000 },
          { name: "운동하기", frequency: 8, completedTimes: 8, completed: true, earnedPerCompletion: 11250 },
        ],
        totalEarned: 90000,
        completionRate: 1.0,
        completedQuests: 4,
        totalQuests: 4,
        createdAt: new Date(2024, 7, 0, 23, 59, 59).toISOString(), // 7월 31일 23:59:59
      },
      {
        month: 6, // 6월
        year: 2024, // 2024년
        allowance: 70000,
        quests: [
          { name: "숙제하기", frequency: 20, completedTimes: 16, completed: false, earnedPerCompletion: 3500 },
          { name: "방 정리하기", frequency: 15, completedTimes: 12, completed: false, earnedPerCompletion: 4667 },
          { name: "독서하기", frequency: 10, completedTimes: 7, completed: false, earnedPerCompletion: 7000 },
        ],
        totalEarned: 35000,
        completionRate: 0.0,
        completedQuests: 0,
        totalQuests: 3,
        createdAt: new Date(2024, 6, 0, 23, 59, 59).toISOString(), // 6월 30일 23:59:59
      },
    ];

    // 테스트 데이터 저장
    for (const data of testData) {
      await addDoc(historyRef, data);
    }

    console.log("테스트 히스토리 데이터가 성공적으로 생성되었습니다!");
    return true;
  } catch (error) {
    console.error("테스트 히스토리 데이터 생성 중 오류 발생:", error);
    return false;
  }
};

// 테스트 데이터 삭제
export const clearTestHistory = async (userId) => {
  try {
    if (!userId) {
      throw new Error("사용자 ID가 필요합니다.");
    }

    const historyRef = collection(db, "users", userId, "history");
    const querySnapshot = await getDocs(historyRef);

    // deleteDoc 함수를 사용하여 각 문서 삭제
    const deletePromises = querySnapshot.docs.map((docSnapshot) =>
      deleteDoc(doc(db, "users", userId, "history", docSnapshot.id))
    );

    await Promise.all(deletePromises);

    console.log("테스트 히스토리 데이터가 삭제되었습니다.");
    return true;
  } catch (error) {
    console.error("테스트 히스토리 데이터 삭제 중 오류 발생:", error);
    return false;
  }
};
