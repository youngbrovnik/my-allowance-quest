import React from 'react';
import QuestList from '../Quest/QuestList';
import RewardWallet from '../Rewards/RewardWallet';
import RewardEntries from '../Rewards/RewardEntries';
import { periodStats } from '../../utils/rewardModel';
import { QUEST_TIME_ZONE } from '../../utils/questDate';
import '../Rewards/Rewards.css';

export default function Dashboard({ data, disabled, actionError, setRewardGoal, spendReward, undoSpend, addQuest, removeQuest, toggleComplete, reorderQuests, updateQuestReward }) {
  const stats = periodStats(data);
  const month = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', timeZone: QUEST_TIME_ZONE });
  return <>
    <div className="reward-dashboard-heading"><p>{month}</p><h2>오늘의 실천, 나를 위한 보상</h2><p>할 일마다 정한 금액을 모아 원하는 보상을 누려보세요.</p></div>
    {actionError && <p role="alert" className="reward-action-error">{actionError}</p>}
    <fieldset className="quest-dashboard reward-dashboard" disabled={disabled}>
      <div className="dashboard-sidebar"><RewardWallet data={data} setRewardGoal={setRewardGoal} spendReward={spendReward} /></div>
      <div className="reward-main">
        <div className="reward-metrics"><div><span>이번 달 실천</span><strong>{stats.completedCount}회</strong></div><div><span>{stats.hasUnknownDays ? '새 기록의 실천일' : '실천한 날짜'}</span><strong>{stats.activeDays}일</strong></div></div>
        <QuestList quests={data.quests} addQuest={addQuest} removeQuest={removeQuest} toggleComplete={toggleComplete} reorderQuests={reorderQuests} updateQuestReward={updateQuestReward} />
        <RewardEntries entries={data.entries} undoSpend={undoSpend} />
      </div>
    </fieldset>
  </>;
}
