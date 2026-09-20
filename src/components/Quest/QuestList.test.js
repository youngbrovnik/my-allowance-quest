import { fireEvent, render, screen } from '@testing-library/react';
import QuestList from './QuestList';

test.each(['', '0', '-1', '1.5', '32'])('잘못된 횟수 %s로 등록하지 않고 입력을 보존한다', (value) => {
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
