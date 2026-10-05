import React, { useState } from 'react';
import './Quest.css';
import { getQuestDay } from '../../utils/questDate';
import { activeEntries, validMoney } from '../../utils/rewardModel';
import { MAX_QUEST_FREQUENCY, isValidQuestFrequency } from '../../utils/inputValidation';

export default function Quest({ quest, entries = [], toggleComplete, removeQuest, updateQuestReward, dragHandleProps = {}, today = getQuestDay(), selectedDate = today }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(quest.rewardAmount);
  const [frequencyValue, setFrequencyValue] = useState(quest.frequency);
  const [error, setError] = useState('');
  const questEntries = activeEntries(entries).filter(entry => entry.type === 'earn' && entry.questId === quest.id);
  const doneOnDate = questEntries.some(entry => entry.date === selectedDate) || (!questEntries.length && quest.lastCompletedDate === selectedDate);
  const monthlyComplete = quest.completedTimes >= quest.frequency;
  const progress = Math.min(100, quest.completedTimes / quest.frequency * 100);
  return <div className={`quest-card ${monthlyComplete ? 'completed' : ''}`}>
    <div className="quest-header">
      <div className="drag-handle" title="드래그하여 순서 변경" {...dragHandleProps}><span aria-hidden="true">⠿</span></div>
      <div className="quest-info"><h3 className="quest-name">{quest.name}</h3><div className="quest-meta"><span className="quest-frequency">월 {quest.frequency}일 목표</span><span className="quest-earned">한 번에 +{quest.rewardAmount.toLocaleString()}원</span></div></div>
      <div className="quest-actions"><button onClick={() => toggleComplete(quest.id, doneOnDate ? 'cancel' : 'complete', selectedDate)} className={`complete-btn${doneOnDate ? ' is-done' : ''}${monthlyComplete && !doneOnDate ? ' completed' : ''}`} disabled={monthlyComplete && !doneOnDate} aria-pressed={doneOnDate} title={doneOnDate ? `${selectedDate} 완료 기록 취소` : `${selectedDate} 완료 기록 추가`}>{doneOnDate ? '완료 ✓' : monthlyComplete ? '이번 달 목표 달성' : '완료'}</button>
        <button className="reward-small-button" onClick={() => { setValue(quest.rewardAmount); setFrequencyValue(quest.frequency); setError(''); setEditing(true); }} aria-label={`${quest.name} 수정`} title="월 목표 횟수와 1회 완료 보상을 수정합니다.">수정</button>
        <button onClick={() => removeQuest(quest.id)} className="remove-btn" aria-label={`${quest.name} 삭제`} title="퀘스트 삭제 · 적립 기록 유지">×</button>
      </div>
    </div>
    {editing && <form className="reward-inline-form" onSubmit={event => {
      event.preventDefault();
      if (!isValidQuestFrequency(frequencyValue)) { setError(`월 목표 횟수는 1회~${MAX_QUEST_FREQUENCY}회의 정수로 입력해 주세요.`); return; }
      if (!validMoney(value)) { setError('보상은 1원~1억 원의 정수로 입력해 주세요.'); return; }
      if (updateQuestReward(quest.id, value, frequencyValue)) { setEditing(false); setError(''); }
    }}><label htmlFor={`frequency-${quest.id}`}>월 목표 횟수</label><input id={`frequency-${quest.id}`} type="number" min="1" max={MAX_QUEST_FREQUENCY} step="1" value={frequencyValue} onChange={e => setFrequencyValue(e.target.value)} />
      <label htmlFor={`reward-${quest.id}`}>1회 완료 보상 (원)</label><input id={`reward-${quest.id}`} type="number" min="1" max="100000000" step="1" value={value} onChange={e => setValue(e.target.value)} />
      <p>목표 횟수는 이번 달에 바로 반영됩니다. 변경한 보상은 다음 완료부터 적용되며 과거 적립액은 바뀌지 않아요.</p>{error && <p role="alert">{error}</p>}<div className="reward-inline-actions"><button type="submit">저장</button><button type="button" onClick={() => setEditing(false)}>취소</button></div>
    </form>}
    <div className="quest-progress"><div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}} /></div><div className="progress-text">{quest.completedTimes} / {quest.frequency}일 실천 · {Math.round(progress)}%</div></div>
  </div>;
}
