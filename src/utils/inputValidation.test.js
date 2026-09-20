import { isValidQuestFrequency } from './inputValidation';

test.each(['', ' ', null, undefined, true, NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('잘못된 숫자 입력 %s를 거부한다', (value) => {
  expect(isValidQuestFrequency(value)).toBe(false);
});

test('퀘스트 횟수는 0을 거부한다', () => {
  expect(isValidQuestFrequency(0)).toBe(false);
});

test.each([[2026, 1, 28], [2024, 1, 29], [2026, 3, 30], [2026, 0, 31]])('해당 월의 일수를 상한으로 사용한다 (%s, %s)', (year, month, days) => {
  const date = new Date(year, month, 1);
  expect(isValidQuestFrequency(1, date)).toBe(true);
  expect(isValidQuestFrequency(String(days), date)).toBe(true);
  expect(isValidQuestFrequency(days + 1, date)).toBe(false);
});
