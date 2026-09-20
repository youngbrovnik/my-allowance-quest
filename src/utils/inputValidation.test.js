import { isValidQuestFrequency } from './inputValidation';

test.each(['', ' ', null, undefined, true, NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('잘못된 숫자 입력 %s를 거부한다', (value) => {
  expect(isValidQuestFrequency(value)).toBe(false);
});

test('퀘스트 횟수는 0을 거부한다', () => {
  expect(isValidQuestFrequency(0)).toBe(false);
});

test.each(['2026-02-01', '2028-02-01', '2026-04-01', '2026-01-01'])('달과 윤년에 관계없이 최대 30회를 허용한다 (%s)', date => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(date));
  try {
    expect(isValidQuestFrequency(1)).toBe(true);
    expect(isValidQuestFrequency('30')).toBe(true);
    expect(isValidQuestFrequency(31)).toBe(false);
  } finally {
    jest.useRealTimers();
  }
});
