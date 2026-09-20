import React from 'react';
import { activeEntries } from '../../utils/rewardModel';
const labels = { earn: '적립', cancel: '적립 취소', spend: '사용', refund: '사용 취소', opening: '기존 금액' };
export default function RewardEntries({ entries = [], undoSpend, disabled = false }) {
  const active = new Set(activeEntries(entries).map(e => e.id));
  return <section className="reward-entries" aria-label="적립·사용 내역"><h3>적립·사용 내역</h3>
    {!entries.length ? <p className="reward-muted">퀘스트를 완료하면 첫 적립 내역이 생겨요.</p> : <ul>{[...entries].reverse().map(entry => <li key={entry.id}>
      <div><span className="reward-entry-type">{labels[entry.type]}</span><strong>{entry.name}</strong><small>{entry.date || '이전 기록 · 날짜 정보 없음'}{!active.has(entry.id) && !entry.reverses ? ' · 취소됨' : ''}</small></div>
      <div className="reward-entry-amount"><strong>{entry.amount > 0 ? '+' : ''}{entry.amount.toLocaleString()}원</strong>
      {entry.type === 'spend' && active.has(entry.id) && undoSpend && <button disabled={disabled} onClick={() => undoSpend(entry.id)}>사용 기록 취소</button>}</div>
    </li>)}</ul>}
  </section>;
}
