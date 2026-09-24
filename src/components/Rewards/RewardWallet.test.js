import { fireEvent, render, screen, within } from '@testing-library/react';
import RewardWallet from './RewardWallet';

test('이번 달 적립액과 최대 보상금 및 수행률을 표시한다', () => {
  render(<RewardWallet data={{
    balance: 7000, earned: 5000, spent: 0, rewardGoal: null,
    quests: [{ frequency: 5, rewardAmount: 2000 }, { frequency: 10, rewardAmount: 1000 }],
  }} />);

  const progress = screen.getByRole('progressbar', { name: '이번 달 보상 수행률' });
  const wallet = progress.closest('.reward-wallet');
  expect(within(wallet).getByRole('heading', { name: '사용 가능한 보상 7,000원' })).toBeInTheDocument();
  expect(within(wallet).getByLabelText('이번 달 보상 현황')).toHaveTextContent('5,000원 / 20,000원');
  expect(within(wallet).getByText('이월된 금액').closest('div')).toHaveTextContent('2,000원');
  expect(progress).toHaveAttribute('value', '25');
});

test('퀘스트가 없으면 최대 금액과 수행률을 0으로 표시한다', () => {
  render(<RewardWallet data={{ balance: 0, earned: 0, spent: 0, rewardGoal: null, quests: [] }} />);
  expect(screen.getByRole('progressbar', { name: '이번 달 보상 수행률' })).toHaveAttribute('value', '0');
  expect(screen.getByText('퀘스트를 추가하면 최대 보상금과 수행률이 표시돼요.')).toBeInTheDocument();
});

test('이월 금액을 직접 입력해 저장한다', () => {
  const setCarriedBalance = jest.fn(() => true);
  render(<RewardWallet data={{ balance: 7000, earned: 5000, spent: 1000, rewardGoal: null, quests: [] }} setCarriedBalance={setCarriedBalance} />);
  fireEvent.click(screen.getByRole('button', { name: '수정' }));
  fireEvent.change(screen.getByLabelText('이월 금액 (원)'), { target: { value: '12000' } });
  fireEvent.click(screen.getByRole('button', { name: '저장' }));
  expect(setCarriedBalance).toHaveBeenCalledWith('12000');
});
