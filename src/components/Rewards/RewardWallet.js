import React, { useEffect, useState } from 'react';
import { monthlyMaxReward, validMoney } from '../../utils/rewardModel';

export default function RewardWallet({ data, setRewardGoal, spendReward }) {
  const goal = data.rewardGoal;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(goal?.name || '');
  const [amount, setAmount] = useState(goal?.amount || '');
  const [error, setError] = useState('');
  const [confirmUse, setConfirmUse] = useState(false);
  useEffect(() => { setName(goal?.name || ''); setAmount(goal?.amount || ''); setConfirmUse(false); }, [goal]);
  const submit = event => {
    event.preventDefault();
    if (!name.trim() || !validMoney(amount)) { setError('보상 이름과 1원~1억 원의 정수 금액을 입력해 주세요.'); return; }
    if (setRewardGoal(name, amount)) { setEditing(false); setError(''); }
  };
  const progress = goal ? Math.min(100, Math.floor(data.balance / goal.amount * 100)) : 0;
  const maxReward = monthlyMaxReward(data.quests);
  const monthlyProgress = maxReward > 0 ? Math.min(100, Math.floor(data.earned / maxReward * 100)) : 0;
  const carriedBalance = Math.max(0, data.balance - data.earned + data.spent);
  return <section className="reward-wallet" aria-label="나의 보상">
    <div className="reward-balance-summary">
      <p className="reward-eyebrow">차곡차곡 모은 나의 보상</p>
      <h2 aria-label={`사용 가능한 보상 ${data.balance.toLocaleString()}원`}>{data.balance.toLocaleString()}<small>원</small></h2>
      <p className="reward-muted">사용 가능한 총금액 · 다음 달에도 이어져요</p>
      <dl className="reward-balance-breakdown">
        <div><dt>이월된 금액</dt><dd>{carriedBalance.toLocaleString()}원</dd></div>
        <div><dt>이번 달 적립</dt><dd>+{data.earned.toLocaleString()}원</dd></div>
        <div><dt>이번 달 사용</dt><dd>−{data.spent.toLocaleString()}원</dd></div>
      </dl>
    </div>
    <div className="monthly-reward-progress" aria-label="이번 달 보상 현황">
      <div className="monthly-reward-heading"><p className="reward-eyebrow">이번 달 보상 수행률</p><strong>{monthlyProgress}%</strong></div>
      <p className="monthly-reward-amount"><strong>{data.earned.toLocaleString()}원</strong><span> / {maxReward.toLocaleString()}원</span></p>
      <p className="reward-muted">이번 달 적립 / 이번 달 최대 보상금</p>
      <progress aria-label="이번 달 보상 수행률" max="100" value={monthlyProgress} />
      {maxReward === 0 && <p className="reward-muted">퀘스트를 추가하면 최대 보상금과 수행률이 표시돼요.</p>}
    </div>
    <div className="reward-goal">
      {goal && !editing ? <>
        <p className="reward-eyebrow">나를 위한 다음 보상</p><h3>{goal.name}</h3>
        <p>목표 금액: {goal.amount.toLocaleString()}원</p>
        <progress aria-label="보상 목표 달성률" max="100" value={progress} />
        <p>{progress}% · {data.balance >= goal.amount ? '이제 보상을 누릴 수 있어요!' : `${(goal.amount - data.balance).toLocaleString()}원 더 모으면 돼요.`}</p>
        <div className="reward-buttons"><button onClick={() => { setEditing(true); setError(''); }}>보상 목표 수정</button><button className="reward-primary" disabled={data.balance < goal.amount} onClick={() => setConfirmUse(true)}>보상 사용 기록</button></div>
        {confirmUse && <div className="reward-confirm"><p>실제로 보상을 누리셨나요? 기록하면 잔액에서 {goal.amount.toLocaleString()}원이 차감됩니다.</p><button className="reward-primary" onClick={() => { if (spendReward()) setConfirmUse(false); }}>사용했어요</button><button onClick={() => setConfirmUse(false)}>돌아가기</button></div>}
      </> : <form onSubmit={submit} className="reward-form">
        <h3>{goal ? '보상 목표 수정' : '무엇을 위해 모아볼까요?'}</h3>
        <label htmlFor="reward-goal-name">보상 이름</label><input id="reward-goal-name" value={name} maxLength={80} placeholder="예: 갖고 싶던 운동화" onChange={e => setName(e.target.value)} />
        <label htmlFor="reward-goal-amount">목표 금액 (원)</label><input id="reward-goal-amount" type="number" min="1" max="100000000" step="1" value={amount} placeholder="예: 120000" onChange={e => setAmount(e.target.value)} />
        {error && <p role="alert">{error}</p>}
        <button className="reward-primary" type="submit">보상 목표 저장</button>
        {goal && <button type="button" onClick={() => { setEditing(false); setName(goal.name); setAmount(goal.amount); setError(''); }}>수정 취소</button>}
      </form>}
    </div>
    <p className="reward-footnote">내 돈으로 나에게 주는 보상을 기록해요. 앱에서 현금을 지급하거나 결제하지 않습니다.</p>
    {data.migratedFromLegacy && <p className="reward-footnote">기존에 표시되던 획득액을 시작 잔액으로 가져왔어요. 과거 월별 기록은 다시 더하지 않습니다.</p>}
  </section>;
}
