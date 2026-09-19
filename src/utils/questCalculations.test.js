import { calculateTotalEarned, areAllQuestsCompleted } from './questCalculations';

const complete = { frequency: 3, completedTimes: 3, earnedPerCompletion: 1000 };

test('전체 완료 시 반올림 차액을 포함한 용돈 전액을 지급한다', () => {
  expect(calculateTotalEarned([complete, complete], 10000)).toBe(10000);
});

test('빈 목록은 전체 완료로 취급하지 않는다', () => {
  expect(areAllQuestsCompleted([])).toBe(false);
  expect(calculateTotalEarned([], 10000)).toBe(0);
});

test('일부 완료 시 실제 횟수로 계산하며 용돈 상한을 지킨다', () => {
  const quests = [complete, { ...complete, completedTimes: 1 }];
  expect(calculateTotalEarned(quests, 10000)).toBe(4000);
  expect(calculateTotalEarned(quests, 3000)).toBe(3000);
  expect(calculateTotalEarned([complete], 0)).toBe(0);
});
