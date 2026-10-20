import { describe, expect, it } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import { useUndoHistory } from "@/services/undo-history";

describe("useUndoHistory", () => {
  it("restores complete snapshots in both directions without triggering renders", async () => {
    let renders = 0;
    const { result, rerender } = await renderHook(() => {
      renders += 1;
      return useUndoHistory<{ tree: string; selectedPath: string[] }>();
    });
    const before = { tree: "before", selectedPath: ["first"] };
    const after = { tree: "after", selectedPath: ["second"] };
    const initialRenders = renders;
    const initialUndo = result.current.undo;

    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(false);
    result.current.record(before);
    expect(result.current.canUndo()).toBe(true);
    expect(result.current.undo(after)).toBe(before);
    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(true);
    expect(result.current.redo(before)).toBe(after);
    expect(result.current.canUndo()).toBe(true);
    expect(result.current.canRedo()).toBe(false);
    expect(renders).toBe(initialRenders);

    await rerender(undefined);
    expect(result.current.undo).toBe(initialUndo);
    expect(result.current.canUndo()).toBe(true);
  });

  it("drops redo on a new edit and clears both stacks between sessions", async () => {
    const { result } = await renderHook(() => useUndoHistory<string>());
    result.current.record("before");
    result.current.undo("after");
    expect(result.current.canRedo()).toBe(true);

    result.current.record("new branch");
    expect(result.current.canRedo()).toBe(false);
    result.current.clear();
    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(false);

    result.current.record("first");
    result.current.record("second");
    result.current.undo("third");
    result.current.clear();
    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(false);
  });

  it("rejects empty undo and redo without changing history", async () => {
    const { result } = await renderHook(() => useUndoHistory<string>());
    expect(() => result.current.undo("current")).toThrow("Cannot undo: undo history is empty.");
    expect(() => result.current.redo("current")).toThrow("Cannot redo: redo history is empty.");
    expect(result.current.canUndo()).toBe(false);
    expect(result.current.canRedo()).toBe(false);
  });
});
