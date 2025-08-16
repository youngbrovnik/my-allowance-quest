import React, { useState, useEffect } from "react";
import { auth } from "../../config/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import "./Login.css";

function Login({ onLogin, isLoggedIn, user }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setError(error.message);
    }
  };

  if (isLoggedIn) {
    return (
      <div className="login-container">
        <div className="user-info">
          <p>안녕하세요, {user.email}님!</p>
          <button onClick={handleLogout} className="logout-btn">
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h2>용돈 퀘스트 시작하기</h2>
      <p className="login-description">구글 계정으로 간편하게 로그인하고 용돈 퀘스트를 시작하세요!</p>

      <button onClick={handleGoogleLogin} disabled={loading} className="google-login-btn">
        <span className="google-icon">G</span>
        {loading ? "로그인 중..." : "Google로 로그인"}
      </button>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default Login;
