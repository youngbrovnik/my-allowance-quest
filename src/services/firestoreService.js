import { db } from "../config/firebase";
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

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
    return null;
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
