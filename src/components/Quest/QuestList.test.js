import { fireEvent, render, screen } from '@testing-library/react';
import QuestList from './QuestList';

beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(new Date('2026-09-20T10:00:00Z')); });
afterEach(() => jest.useRealTimers());

test.each(['', '0', '-1', '1.5', '31', '32'])('잘못된 횟수 %s로 등록하지 않고 입력을 보존한다', (value) => {
  const addQuest = jest.fn();
  render(<QuestList quests={[]} addQuest={addQuest} />);
  const name = screen.getByLabelText('퀘스트 이름');
  const frequency = screen.getByRole('spinbutton', { name: '월 퀘스트 횟수' });
  fireEvent.change(name, { target: { value: '책 읽기' } });
  fireEvent.change(frequency, { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: '퀘스트 추가' }));
  fireEvent.keyDown(frequency, { key: 'Enter' });
  expect(addQuest).not.toHaveBeenCalled();
  expect(name).toHaveValue('책 읽기');
  expect(screen.getByRole('alert')).toBeInTheDocument();
  fireEvent.change(frequency, { target: { value: '1' } });
  fireEvent.keyDown(frequency, { key: 'Enter' });
  expect(addQuest).toHaveBeenCalledWith('책 읽기', 1, 1000);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('지난 날짜를 선택하면 해당 날짜 완료 동작을 전달한다', () => {
  const toggleComplete = jest.fn();
  render(<QuestList quests={[{ id: 'read', name: '독서', frequency: 10, completedTimes: 0, rewardAmount: 1000, lastCompletedDate: null }]} entries={[]} toggleComplete={toggleComplete} addQuest={jest.fn()} removeQuest={jest.fn()} reorderQuests={jest.fn()} updateQuestReward={jest.fn()} />);
  const dateInput = screen.getByLabelText('날짜 선택');
  fireEvent.change(dateInput, { target: { value: '2026-09-19' } });
  expect(dateInput).toHaveValue('2026-09-19');
  fireEvent.click(screen.getByRole('button', { name: '완료' }));
  expect(toggleComplete).toHaveBeenCalledWith('read', 'complete', '2026-09-19');
  fireEvent.click(screen.getByRole('button', { name: '오늘로' }));
  expect(dateInput).toHaveValue('2026-09-20');
  expect(screen.queryByRole('button', { name: '오늘로' })).not.toBeInTheDocument();
});
