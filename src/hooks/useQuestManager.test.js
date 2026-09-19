import { act, renderHook } from "@testing-library/react";
import { useQuestManager } from "./useQuestManager";

test.each([0, -1, 1.5, 32, '', Infinity])('직접 호출해도 잘못된 횟수 %s를 저장하지 않는다', (frequency) => {
  const save = jest.fn();
  const { result } = renderHook(() => useQuestManager(10000, save, jest.fn()));
  act(() => { result.current.addQuest('책 읽기', frequency); });
  expect(save).not.toHaveBeenCalled();
  expect(result.current.quests).toEqual([]);
  expect(result.current.earned).toBe(0);
});

function setupRewards(completedTimes = [3, 3]) {
  const save = jest.fn();
  const { result } = renderHook(() => useQuestManager(10000, save, jest.fn()));
  act(() => {
    result.current.setQuests(completedTimes.map((times, index) => ({
      name: `퀘스트 ${index + 1}`, frequency: 3, completedTimes: times,
      completed: times === 3, earnedPerCompletion: 1000,
    })));
  });
  return { result, save };
}

test('마지막 완료 후 순서를 바꿔도 전액 보상을 유지하고 저장한다', () => {
  const { result, save } = setupRewards([3, 2]);
  act(() => { result.current.toggleQuestComplete(1); });
  expect(result.current.earned).toBe(10000);
  act(() => { result.current.reorderQuests(0, 1); });
  expect(result.current.quests.map(q => q.name)).toEqual(['퀘스트 2', '퀘스트 1']);
  expect(result.current.earned).toBe(10000);
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ earned: 10000 }));
});

test('전체 완료 후 용돈을 변경하면 새 용돈 전액으로 계산한다', () => {
  const { result } = setupRewards();
  act(() => { result.current.recalculateQuestsForNewAllowance(11000); });
  expect(result.current.earned).toBe(11000);
});

test('삭제 후 남은 퀘스트가 모두 완료되면 전액, 모두 삭제하면 0원이다', () => {
  const { result, save } = setupRewards([3, 1]);
  act(() => { result.current.removeQuest(1); });
  expect(result.current.earned).toBe(10000);
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ earned: 10000 }));
  act(() => { result.current.removeQuest(0); });
  expect(result.current.earned).toBe(0);
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ earned: 0, quests: [] }));
});

test('일부 완료 상태에서는 순서를 변경해도 실제 획득 금액을 유지한다', () => {
  const { result, save } = setupRewards([3, 1]);
  act(() => { result.current.reorderQuests(0, 1); });
  expect(result.current.earned).toBe(4000);
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ earned: 4000 }));
});

test('새 미완료 퀘스트를 추가하면 전체 완료 보상을 적용하지 않는다', () => {
  const { result } = setupRewards();
  act(() => { result.current.addQuest('새 퀘스트', 3); });
  expect(result.current.earned).toBe(6000);
});
