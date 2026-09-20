import { act, fireEvent, render, screen } from '@testing-library/react';
import { auth } from '../../config/firebase';
import { loadMonthlyHistory } from '../../services/firestoreService';
import History from './History';

jest.mock('../../config/firebase', () => ({ auth: { currentUser: null } }));
jest.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ theme: 'dark' }) }));
jest.mock('../../services/firestoreService', () => ({ loadMonthlyHistory: jest.fn() }));

let log;
beforeEach(() => {
  jest.resetAllMocks();
  auth.currentUser = { uid: 'user-a' };
  log = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { log.mockRestore(); });

test('조회 실패 시 기록 없음 메시지 대신 오류와 재시도 버튼을 표시한다', async () => {
  loadMonthlyHistory.mockRejectedValueOnce(new Error('offline'));
  render(<History />);
  expect(await screen.findByRole('alert')).toHaveTextContent('히스토리를 불러오는 중 오류');
  expect(screen.getByRole('button', { name: '다시 불러오기' })).toBeInTheDocument();
  expect(screen.queryByText('아직 히스토리가 없습니다.')).not.toBeInTheDocument();
});

test('재시도 중 로딩을 표시하고 성공하면 월별 기록을 보여준다', async () => {
  let finish;
  loadMonthlyHistory.mockRejectedValueOnce(new Error('offline'))
    .mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  render(<History />);
  fireEvent.click(await screen.findByRole('button', { name: '다시 불러오기' }));
  expect(screen.getByText('히스토리를 불러오는 중...')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await act(async () => { finish([{
    id: '2026-06', year: 2026, month: 6, allowance: 10000, totalEarned: 5000,
    completionRate: 0.5, completedQuests: 1, totalQuests: 2, quests: [],
  }]); });
  expect(screen.getByText('6월')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('실패 후 재시도에 성공한 빈 목록은 기록 없음으로 표시한다', async () => {
  loadMonthlyHistory.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
  render(<History />);
  fireEvent.click(await screen.findByRole('button', { name: '다시 불러오기' }));
  expect(await screen.findByText('아직 히스토리가 없습니다.')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('재시도가 실패해도 빈 기록으로 표시하지 않는다', async () => {
  loadMonthlyHistory.mockRejectedValue(new Error('offline'));
  render(<History />);
  const retry = await screen.findByRole('button', { name: '다시 불러오기' });
  await act(async () => { fireEvent.click(retry); });
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.queryByText('아직 히스토리가 없습니다.')).not.toBeInTheDocument();
});

test('로그인하지 않은 경우 조회하지 않고 로그인 안내를 표시한다', async () => {
  auth.currentUser = null;
  render(<History />);
  expect(await screen.findByRole('alert')).toHaveTextContent('로그인이 필요합니다');
  expect(loadMonthlyHistory).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: '다시 불러오기' })).not.toBeInTheDocument();
});

test('전체 요약은 13개월 이상인 모든 기록의 월수와 금액을 집계한다', async () => {
  loadMonthlyHistory.mockResolvedValueOnce(Array.from({ length: 15 }, (_, i) => ({
    id: String(i), year: 2025 + Math.floor(i / 12), month: i % 12 + 1,
    allowance: 10000, totalEarned: 1000, completionRate: 0.5,
    completedQuests: 1, totalQuests: 2, quests: [],
  })));
  render(<History />);
  expect(await screen.findByText('15개월')).toBeInTheDocument();
  expect(screen.getByText('15,000원')).toBeInTheDocument();
  expect(loadMonthlyHistory).toHaveBeenCalledWith('user-a');
});

test('일부 실천도 횟수로 표시하며 옛 기록의 날짜는 추정하지 않는다', async () => {
  loadMonthlyHistory.mockResolvedValueOnce([{ id: 'old', year: 2026, month: 6, totalEarned: 4000,
    quests: [{ name: '운동', completedTimes: 2, frequency: 12 }], completionRate: 0 }]);
  render(<History />);
  expect(await screen.findByText('정보 없음')).toBeInTheDocument();
  expect(screen.getByText('2 / 12일 실천')).toBeInTheDocument();
  expect(screen.getByText(/기존 완료 횟수와 획득액은 그대로/)).toBeInTheDocument();
});
