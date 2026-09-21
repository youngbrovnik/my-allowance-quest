import { render, screen, within } from '@testing-library/react';
import RewardWallet from './RewardWallet';

test('이번 달 적립액과 최대 보상금 및 수행률을 표시한다', () => {
  render(<RewardWallet data={{
    balance: 7000, earned: 5000, spent: 0, rewardGoal: null,
    quests: [{ frequency: 5, rewardAmount: 2000 }, { frequency: 10, rewardAmount: 1000 }],
  }} />);

  const progress = screen.getByRole('progressbar', { name: '이번 달 보상 수행률' });
  const wallet = progress.closest('.reward-wallet');
  expect(within(wallet).getByRole('heading', { name: '이번 달 모은 보상 5,000원 / 최대 20,000원' })).toHaveTextContent('5,000원 / 20,000원');
  expect(within(wallet).getByLabelText('사용 가능한 보상 7,000원')).toBeInTheDocument();
  expect(progress).toHaveAttribute('value', '25');
});

test('퀘스트가 없으면 최대 금액과 수행률을 0으로 표시한다', () => {
  render(<RewardWallet data={{ balance: 0, earned: 0, spent: 0, rewardGoal: null, quests: [] }} />);
  expect(screen.getByRole('progressbar', { name: '이번 달 보상 수행률' })).toHaveAttribute('value', '0');
  expect(screen.getByText('퀘스트를 추가하면 최대 보상금과 수행률이 표시돼요.')).toBeInTheDocument();
});
