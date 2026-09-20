import React, { useState, useEffect } from 'react';
import { loadMonthlyHistory } from '../../services/firestoreService';
import { auth } from '../../config/firebase';
import { periodStats } from '../../utils/rewardModel';
import { getQuestMonth } from '../../utils/questDate';
import RewardEntries from '../Rewards/RewardEntries';
import '../Rewards/Rewards.css';

export function HistoryView({ history = [], currentData, undoSpend, disabled }) {
  const [selected, setSelected] = useState('current');
  const [year, month] = getQuestMonth().split('-').map(Number);
  const records = currentData ? [{ ...currentData, id: 'current', year, month }, ...history] : history;
  const record = records.find(item => item.id === selected) || records[0];
  const summary = records.reduce((sum, item) => { const stats = periodStats(item); return { completed: sum.completed + stats.completedCount, earned: sum.earned + stats.earned, spent: sum.spent + stats.spent }; }, { completed: 0, earned: 0, spent: 0 });
  const stats = record && periodStats(record);
  return <section className="reward-history"><h2>작은 실천의 기록</h2><p className="reward-muted">목표를 모두 끝내지 않아도, 한 번의 실천은 그대로 남아요.</p>
    {!records.length ? <p>아직 히스토리가 없습니다.</p> : <>
      <div className="reward-metrics"><div><span>기록한 기간</span><strong>{records.length}개월</strong></div><div><span>전체 실천</span><strong>{summary.completed}회</strong></div><div><span>전체 적립</span><strong>{summary.earned.toLocaleString()}원</strong></div><div><span>전체 사용</span><strong>{summary.spent.toLocaleString()}원</strong></div></div>
      <label htmlFor="history-month">월별 기록</label><select id="history-month" value={record?.id} onChange={event => setSelected(event.target.value)}>{records.map(item => <option value={item.id} key={item.id}>{item.year}년 {item.month}월{item.id === 'current' ? ' · 이번 달' : ''}</option>)}</select>
      {record && <article className="reward-month"><h3>{record.month}월</h3>
        <div className="reward-metrics"><div><span>완료 횟수</span><strong>{stats.completedCount}회</strong></div><div><span>{stats.hasUnknownDays ? '날짜 확인 가능한 실천일' : '실천한 날짜'}</span><strong>{stats.hasUnknownDays && stats.activeDays === 0 ? '정보 없음' : `${stats.activeDays}일`}</strong></div><div><span>적립</span><strong>{stats.earned.toLocaleString()}원</strong></div><div><span>사용</span><strong>{stats.spent.toLocaleString()}원</strong></div></div>
        {stats.hasUnknownDays && <p className="reward-footnote">이전 기록에는 완료 날짜가 없어 실천일을 모두 계산할 수 없습니다. 기존 완료 횟수와 획득액은 그대로 보존했습니다.</p>}
        <h4>퀘스트별 실천</h4><ul className="reward-quest-summary">{(record.quests || []).map((q, i) => <li key={q.id || i}><strong>{q.name}</strong><span>{q.completedTimes || 0} / {q.frequency}일 실천</span><progress aria-label={`${q.name} 월 목표 진행률`} value={Math.min(q.completedTimes || 0, q.frequency)} max={q.frequency} /></li>)}</ul>
        <RewardEntries entries={record.entries} undoSpend={record.id === 'current' ? undoSpend : undefined} disabled={disabled} />
        {record.id !== 'current' && <p className="reward-footnote">지난달 기록은 보관용입니다. 사용 기록 취소는 이번 달 내역에서 할 수 있어요.</p>}
      </article>}
    </>}
  </section>;
}
export default function History(props) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    const load = async () => {
      try {
        if (!auth.currentUser) throw new Error('login');
        const result = await loadMonthlyHistory(auth.currentUser.uid);
        if (!cancelled) setHistory(result);
      } catch (error) {
        if (!cancelled) setError(error.message === 'login' ? '로그인이 필요합니다.' : '히스토리를 불러오는 중 오류가 발생했습니다.');
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [retry]);
  if (loading) return <p role="status">히스토리를 불러오는 중...</p>;
  if (error) return <div role="alert"><p>{error}</p>{auth.currentUser && <button onClick={() => setRetry(value => value + 1)}>다시 불러오기</button>}</div>;
  return <HistoryView history={history} {...props} />;
}
