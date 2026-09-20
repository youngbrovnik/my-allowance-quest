import React, { useState } from 'react';
import './Quest.css';
import { getQuestDay } from '../../utils/questDate';
import { validMoney } from '../../utils/rewardModel';

export default function Quest({ quest, toggleComplete, removeQuest, updateQuestReward, dragHandleProps = {}, today = getQuestDay() }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(quest.rewardAmount);
  const [error, setError] = useState('');
  const doneToday = quest.lastCompletedDate === today;
  const monthlyComplete = quest.completedTimes >= quest.frequency;
  const progress = Math.min(100, quest.completedTimes / quest.frequency * 100);
  return <div className={`quest-card ${monthlyComplete ? 'completed' : ''}`}>
    <div className="quest-header">
      <div className="drag-handle" title="드래그하여 순서 변경" {...dragHandleProps}><span aria-hidden="true">⠿</span></div>
      <div className="quest-info"><h3 className="quest-name">{quest.name}</h3><div className="quest-meta"><span className="quest-frequency">월 {quest.frequency}일 목표</span><span className="quest-earned">한 번에 +{quest.rewardAmount.toLocaleString()}원</span></div></div>
      <div className="quest-actions"><button onClick={() => toggleComplete(quest.id)} className={`complete-btn ${monthlyComplete ? 'completed' : ''}`} disabled={monthlyComplete || doneToday}>{doneToday ? '오늘 완료했어요 ✓' : monthlyComplete ? '이번 달 목표 달성' : '오늘 완료'}</button>
        {doneToday && <button className="cancel-today-btn" onClick={() => toggleComplete(quest.id, 'cancel')}>오늘 기록 취소</button>}
        <button className="reward-small-button" onClick={() => { setValue(quest.rewardAmount); setError(''); setEditing(true); }} aria-label={`${quest.name} 보상 수정`}>보상 수정</button>
        <button onClick={() => removeQuest(quest.id)} className="remove-btn" aria-label={`${quest.name} 삭제`} title="퀘스트 삭제 · 적립 기록 유지">×</button>
      </div>
    </div>
    {editing && <form className="reward-inline-form" onSubmit={event => {
      event.preventDefault();
      if (!validMoney(value)) { setError('보상은 1원~1억 원의 정수로 입력해 주세요.'); return; }
      if (updateQuestReward(quest.id, value)) { setEditing(false); setError(''); }
    }}><label htmlFor={`reward-${quest.id}`}>1회 완료 보상 (원)</label><input id={`reward-${quest.id}`} type="number" min="1" max="100000000" step="1" value={value} onChange={e => setValue(e.target.value)} />
      <p>변경한 금액은 다음 완료부터 적용됩니다. 과거 적립액은 바뀌지 않아요.</p>{error && <p role="alert">{error}</p>}<button type="submit">금액 저장</button><button type="button" onClick={() => setEditing(false)}>수정 취소</button>
    </form>}
    <div className="quest-progress"><div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}} /></div><div className="progress-text">{quest.completedTimes} / {quest.frequency}일 실천 · {Math.round(progress)}%</div></div>
  </div>;
}
