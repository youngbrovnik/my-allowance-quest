import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { loadMonthlyHistory, generateTestHistory, clearTestHistory } from "../../services/firestoreService";
import { auth } from "../../config/firebase";
import "./History.css";

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    const loadHistory = async () => {
      if (auth.currentUser) {
        try {
          setError(null);
          const monthlyHistory = await loadMonthlyHistory(auth.currentUser.uid, 12);
          setHistory(monthlyHistory);
        } catch (error) {
          console.error("히스토리 로딩 중 오류:", error);
          setError("히스토리를 불러오는 중 오류가 발생했습니다.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setError("로그인이 필요합니다.");
      }
    };

    loadHistory();
  }, []);

  const getCompletionColor = (rate) => {
    if (rate >= 0.8) return "#4caf50"; // 녹색
    if (rate >= 0.6) return "#ff9800"; // 주황색
    if (rate >= 0.4) return "#ffc107"; // 노란색
    return "#f44336"; // 빨간색
  };

  const handleMonthSelect = (monthData) => {
    setSelectedMonth(monthData);
  };

  const closeMonthDetail = () => {
    setSelectedMonth(null);
  };

  // 테스트 데이터 생성
  const handleGenerateTestData = async () => {
    if (!auth.currentUser) {
      setError("로그인이 필요합니다.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const success = await generateTestHistory(auth.currentUser.uid);
      if (success) {
        // 히스토리 다시 로드
        const monthlyHistory = await loadMonthlyHistory(auth.currentUser.uid, 12);
        setHistory(monthlyHistory);
      } else {
        setError("테스트 데이터 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("테스트 데이터 생성 중 오류:", error);
      setError("테스트 데이터 생성 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 테스트 데이터 삭제
  const handleClearTestData = async () => {
    if (!auth.currentUser) {
      setError("로그인이 필요합니다.");
      return;
    }

    if (!window.confirm("테스트 데이터를 모두 삭제하시겠습니까?")) return;

    setIsClearing(true);
    setError(null);
    try {
      const success = await clearTestHistory(auth.currentUser.uid);
      if (success) {
        setHistory([]);
      } else {
        setError("테스트 데이터 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("테스트 데이터 삭제 중 오류:", error);
      setError("테스트 데이터 삭제 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="history-container" data-theme={theme}>
        <div className="loading">히스토리를 불러오는 중...</div>
      </div>
    );
  }

  if (error && !auth.currentUser) {
    return (
      <div className="history-container" data-theme={theme}>
        <div className="error-message">
          <p>{error}</p>
          <p>로그인 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container" data-theme={theme}>
      <h2 className="history-title">퀘스트 히스토리</h2>

      {/* 에러 메시지 */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* 테스트 데이터 관리 버튼 */}
      <div className="test-data-controls">
        <button className="test-btn generate" onClick={handleGenerateTestData} disabled={isGenerating}>
          {isGenerating ? "생성 중..." : "🧪 테스트 데이터 생성"}
        </button>
        {history.length > 0 && (
          <button className="test-btn clear" onClick={handleClearTestData} disabled={isClearing}>
            {isClearing ? "삭제 중..." : "🗑️ 테스트 데이터 삭제"}
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="no-history">
          <p>아직 히스토리가 없습니다.</p>
          <p>위의 "테스트 데이터 생성" 버튼을 클릭하여 샘플 데이터를 만들어보세요!</p>
        </div>
      ) : (
        <div className="history-content">
          <div className="history-summary">
            <h3>전체 요약</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">총 기록 월</span>
                <span className="stat-value">{history.length}개월</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">평균 완료율</span>
                <span className="stat-value">
                  {Math.round((history.reduce((acc, h) => acc + h.completionRate, 0) / history.length) * 100)}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">총 획득 금액</span>
                <span className="stat-value">
                  {history.reduce((acc, h) => acc + h.totalEarned, 0).toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          <div className="history-list">
            <h3>월별 기록</h3>
            <div className="month-grid">
              {history.map((monthData, index) => (
                <div key={monthData.id || index} className="month-card" onClick={() => handleMonthSelect(monthData)}>
                  <div className="month-header">
                    <h4>{monthData.month}월</h4>
                    <span className="year">{monthData.year}년</span>
                  </div>

                  <div className="month-stats">
                    <div className="completion-rate">
                      <div
                        className="rate-circle"
                        style={{
                          background: `conic-gradient(${getCompletionColor(monthData.completionRate)} ${
                            monthData.completionRate * 360
                          }deg, var(--bg-input) 0deg)`,
                        }}
                      >
                        <span className="rate-text">{Math.round(monthData.completionRate * 100)}%</span>
                      </div>
                    </div>

                    <div className="month-details">
                      <div className="detail-item">
                        <span className="detail-label">용돈</span>
                        <span className="detail-value">{monthData.allowance?.toLocaleString()}원</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">완료</span>
                        <span className="detail-value">
                          {monthData.completedQuests}/{monthData.totalQuests}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">획득</span>
                        <span className="detail-value">{monthData.totalEarned?.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 월별 상세 모달 */}
      {selectedMonth && (
        <div className="month-detail-modal" onClick={closeMonthDetail}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedMonth.month}월 상세 기록</h3>
              <button className="close-btn" onClick={closeMonthDetail}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="month-overview">
                <div className="overview-item">
                  <span className="overview-label">용돈</span>
                  <span className="overview-value">{selectedMonth.allowance?.toLocaleString()}원</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">완료율</span>
                  <span className="overview-value">{Math.round(selectedMonth.completionRate * 100)}%</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">획득 금액</span>
                  <span className="overview-value">{selectedMonth.totalEarned?.toLocaleString()}원</span>
                </div>
              </div>

              <div className="quest-details">
                <h4>퀘스트별 완료 현황</h4>
                <div className="quest-list">
                  {selectedMonth.quests?.map((quest, index) => (
                    <div key={index} className="quest-item">
                      <div className="quest-info">
                        <span className="quest-name">{quest.name}</span>
                        <span className="quest-frequency">{quest.frequency}회/월</span>
                      </div>
                      <div className="quest-completion">
                        <span className="completion-status">{quest.completed ? "✅ 완료" : "⏳ 진행중"}</span>
                        <span className="completion-times">
                          {quest.completedTimes}/{quest.frequency}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
