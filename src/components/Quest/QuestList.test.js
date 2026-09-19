import { fireEvent, render, screen } from '@testing-library/react';
import QuestList from './QuestList';

test.each(['', '0', '-1', '1.5', '32'])('잘못된 횟수 %s로 등록하지 않고 입력을 보존한다', (value) => {
  const addQuest = jest.fn();
  render(<QuestList quests={[]} addQuest={addQuest} />);
  const name = screen.getByPlaceholderText('Quest Name');
  const frequency = screen.getByRole('spinbutton');
  fireEvent.change(name, { target: { value: '책 읽기' } });
  fireEvent.change(frequency, { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Add Quest' }));
  fireEvent.keyDown(frequency, { key: 'Enter' });
  expect(addQuest).not.toHaveBeenCalled();
  expect(name).toHaveValue('책 읽기');
  expect(screen.getByRole('alert')).toBeInTheDocument();
  fireEvent.change(frequency, { target: { value: '1' } });
  fireEvent.keyDown(frequency, { key: 'Enter' });
  expect(addQuest).toHaveBeenCalledWith('책 읽기', 1);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
