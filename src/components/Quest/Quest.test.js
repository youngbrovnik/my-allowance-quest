import { act, fireEvent, render, screen } from '@testing-library/react';
import Quest from './Quest';
import { useQuestDay } from '../../hooks/useQuestDay';

function LiveQuest({ quest, toggleComplete }) {
  const today = useQuestDay();
  return <Quest  quest={quest} toggleComplete={toggleComplete} removeQuest={() => {}} today={today} />;
}
const quest = { id: 'exercise', name: '운동', frequency: 12, completedTimes: 1, rewardAmount: 3000, lastCompletedDate: '2026-09-20' };

beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(new Date('2026-09-20T14:59:59Z')); });
afterEach(() => jest.useRealTimers());

test('오늘 완료 상태에서는 추가 완료를 막고 취소 동작을 분리한다', () => {
  const action = jest.fn();
  render(<LiveQuest quest={quest} toggleComplete={action} />);
  expect(screen.getByRole('button', { name: '오늘 완료했어요 ✓' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: '오늘 기록 취소' }));
  expect(action).toHaveBeenCalledWith('exercise', 'cancel');
});

test('화면을 열어둔 채 한국 자정을 지나면 오늘 완료가 활성화된다', () => {
  render(<LiveQuest quest={quest} toggleComplete={jest.fn()} />);
  act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByRole('button', { name: '오늘 완료' })).toBeEnabled();
  expect(screen.queryByRole('button', { name: '오늘 기록 취소' })).not.toBeInTheDocument();
});

test('절전 후 돌아와도 새 날짜를 반영한다', () => {
  render(<LiveQuest quest={quest} toggleComplete={jest.fn()} />);
  jest.setSystemTime(new Date('2026-09-21T01:00:00Z'));
  fireEvent.focus(window);
  expect(screen.getByRole('button', { name: '오늘 완료' })).toBeEnabled();
});

test('월 목표를 달성했으면 다음 날에도 추가 적립을 막는다', () => {
  render(<LiveQuest quest={{ ...quest, completedTimes: 12, completed: true }} toggleComplete={jest.fn()} />);
  act(() => { jest.advanceTimersByTime(1000); });
  expect(screen.getByRole('button', { name: '이번 달 목표 달성' })).toBeDisabled();
});
