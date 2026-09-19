import React from 'react';
import Allowance from '../Allowance/Allowance';
import QuestList from '../Quest/QuestList';

export default function Dashboard({ allowance, earned, quests, disabled, updateAllowance, addQuest, removeQuest, toggleComplete, reorderQuests }) {
  const completed = quests.filter(quest => quest.completed).length;
  const progress = allowance > 0 ? Math.min(100, Math.max(0, Math.round(earned / allowance * 100))) : 0;
  const month = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  return (
    <>
      <div className="dashboard-heading desktop-only">
        <div><p className="dashboard-eyebrow">{month}</p><h2>이번 달의 퀘스트</h2><p>하나씩 실천하고, 나의 목표에 가까워져요.</p></div>
        <span className="dashboard-count">{quests.length}개의 퀘스트</span>
      </div>
      <fieldset className="quest-dashboard" disabled={disabled} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <div className="dashboard-sidebar">
          <Allowance allowance={allowance} updateAllowance={updateAllowance} />
          <div className="earnings-panel">
            <p className="desktop-only dashboard-eyebrow">이번 달 획득 금액</p>
            <h2>Total Earned: {earned.toLocaleString()}</h2>
            <div className="desktop-only earnings-details">
              <div className="dashboard-progress-label"><span>용돈 달성률</span><strong>{progress}%</strong></div>
              <progress aria-label="용돈 달성률" value={progress} max="100" />
              <dl>
                <div><dt>남은 목표 금액</dt><dd>{Math.max(0, allowance - earned).toLocaleString()}원</dd></div>
                <div><dt>완료한 퀘스트</dt><dd>{completed} / {quests.length}</dd></div>
              </dl>
            </div>
          </div>
          <p className="desktop-only dashboard-note">작은 실천도 차곡차곡.<br />완료할 때마다 용돈이 쌓여요.</p>
        </div>
        <QuestList quests={quests} addQuest={addQuest} removeQuest={removeQuest} toggleComplete={toggleComplete} reorderQuests={reorderQuests} allowance={allowance} />
      </fieldset>
    </>
  );
}
