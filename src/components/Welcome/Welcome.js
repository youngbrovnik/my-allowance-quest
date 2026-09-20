import React, { useRef, useState } from "react";
import "./Welcome.css";

const samples = [
  { name: "운동 20분 하기", reward: 3000, icon: "🏃" },
  { name: "책 20분 읽기", reward: 2000, icon: "📖" },
  { name: "방 정리하기", reward: 5000, icon: "🧹" },
];

export default function Welcome() {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState([]);
  const demoHeading = useRef(null);
  const earned = samples.reduce((sum, quest, index) => sum + (completed.includes(index) ? quest.reward : 0), 0);

  const startDemo = () => {
    setStarted(true);
    demoHeading.current.focus();
    demoHeading.current.scrollIntoView?.({ behavior: "smooth", block: "center" });
  };

  return (
    <main className="welcome">
      <section className="welcome-hero" aria-labelledby="welcome-title">
        <p className="welcome-eyebrow">작은 실천, 나를 위한 보상</p>
        <h2 id="welcome-title">해야 할 일을 끝내고,<br />나를 위한 보상을 모으세요.</h2>
        <p className="welcome-lead">운동도, 독서도, 집안일도 퀘스트로.<br />할 일마다 보상 금액을 정하고, 실천한 만큼 모아보세요.</p>
        <button className="welcome-primary" onClick={startDemo}>로그인 없이 체험하기 <span aria-hidden="true">→</span></button>
        <p className="welcome-caption">샘플로 먼저 경험하고, 내 기록은 상단 Google 로그인으로 시작하세요.</p>
      </section>

      <section className="welcome-demo" aria-labelledby="demo-title">
        <div className="welcome-demo-heading">
          <span className="welcome-badge">샘플 체험</span>
          {started && <button className="welcome-reset" onClick={() => setCompleted([])}>체험 초기화</button>}
        </div>
        <h2 id="demo-title" ref={demoHeading} tabIndex={-1}>오늘의 작은 퀘스트</h2>
        <p>완료 버튼을 눌러 보상이 쌓이는 순간을 경험해 보세요.</p>
        <div className="welcome-reward" role="status" aria-live="polite" aria-atomic="true">
          <span>사고 싶은 책 · 목표 10,000원</span>
          <strong>{earned.toLocaleString("ko-KR")}원 <small>모았어요</small></strong>
          <progress aria-label="샘플 보상 달성률" value={earned} max={10000} />
          <span>{earned === 10000 ? "목표 달성! 작은 실천 세 가지가 모였어요." : "하고 싶던 일을 위한 보상을 차곡차곡."}</span>
        </div>
        <ul className="welcome-quests">
          {samples.map((quest, index) => {
            const done = completed.includes(index);
            return (
              <li key={quest.name} className={done ? "is-complete" : ""}>
                <span className="welcome-quest-icon" aria-hidden="true">{quest.icon}</span>
                <div><strong>{quest.name}</strong><span>+{quest.reward.toLocaleString("ko-KR")}원</span></div>
                <button aria-label={`${quest.name} ${done ? "완료 취소" : "완료"}`} aria-pressed={done} onClick={() => {
                  setStarted(true);
                  setCompleted(previous => previous.includes(index) ? previous.filter(item => item !== index) : [...previous, index]);
                }}>{done ? "✓ 취소" : "완료"}</button>
              </li>
            );
          })}
        </ul>
        <p className="welcome-caption">체험 기록은 저장되지 않으며, 로그인하거나 새로고침하면 초기화됩니다.</p>
      </section>

      <section className="welcome-guide" aria-label="사용 방법">
        <ol>
          <li><span>01</span><h3>할 일과 보상 정하기</h3><p>운동 한 번에 3,000원처럼 직접 정해요.</p></li>
          <li><span>02</span><h3>하루 한 번 실천하기</h3><p>오늘 완료를 누르면 정한 금액이 쌓여요.</p></li>
          <li><span>03</span><h3>원하는 보상 누리기</h3><p>목표를 향해 모으고, 사용한 보상도 기록해요.</p></li>
        </ol>
        <p className="welcome-notice">보상 금액은 내 돈으로 나에게 주는 보상을 관리하는 기록입니다. 앱에서 현금을 지급하거나 송금하지 않습니다.</p>
      </section>
    </main>
  );
}
