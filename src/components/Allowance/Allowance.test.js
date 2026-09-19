import { fireEvent, render, screen } from '@testing-library/react';
import Allowance from './Allowance';

test.each(['', '-1', '1.5'])('잘못된 용돈 %s를 저장하지 않고 수정할 수 있다', (value) => {
  const save = jest.fn();
  render(<Allowance allowance={10000} updateAllowance={save} />);
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  const input = screen.getByRole('spinbutton');
  fireEvent.change(input, { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Set' }));
  expect(save).not.toHaveBeenCalled();
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(input).toHaveAttribute('aria-invalid', 'true');
  fireEvent.change(input, { target: { value: '0' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(save).toHaveBeenCalledWith(0);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
