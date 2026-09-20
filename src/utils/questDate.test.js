import { getQuestDay, getQuestMonth } from './questDate';
import { getDaysInMonth } from './inputValidation';

test('UTC 날짜와 관계없이 한국 자정에 날짜와 월이 바뀐다', () => {
  expect(getQuestDay(new Date('2026-09-30T14:59:59Z'))).toBe('2026-09-30');
  expect(getQuestDay(new Date('2026-09-30T15:00:00Z'))).toBe('2026-10-01');
  expect(getQuestMonth(new Date('2026-12-31T15:00:00Z'))).toBe('2027-01');
  expect(getDaysInMonth(new Date('2028-01-31T15:00:00Z'))).toBe(29);
});
