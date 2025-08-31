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
