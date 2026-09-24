import { describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import { useMemory } from "@/services/memory";
import { naggerToDto } from "@/services/model-conversion";
import { createParcelVersionStamp } from "@/services/parcel-versioning";
import { createNaggerFormula } from "@/services/sending/queueNagger";
import { treeOperations } from "@/services/tree-operations";

jest.mock("uuid", () => {
  let nextId = 0;
  return { v7: () => `00000000-0000-0000-0000-${String(++nextId).padStart(12, "0")}` };
});

describe("createParcelVersionStamp", () => {
  it("reads the Nagger root version from memory and reserves the next version", async () => {
    const nagger = { ...treeOperations.node.createNagger(), version: 7 };
    const tree = treeOperations.tree.createNagPlan([nagger]);
    const memory = await renderHook(() => useMemory());
    const queuedAt = "2026-09-23T10:00:00.000Z";
    const formula = createNaggerFormula(naggerToDto(nagger));
    let stamp: ReturnType<typeof createParcelVersionStamp> | undefined;

    await act(async () => {
      memory.result.current.write.setTree(tree);
      stamp = createParcelVersionStamp({ memory: memory.result.current, formula, queuedAt });
    });

    expect(stamp).toEqual({ baseVersion: 7, nextVersion: 8 });
    expect(memory.result.current.read.getTree().nags[0]).toMatchObject({
      id: nagger.id,
      version: 8,
      updatedAt: queuedAt,
    });
    expect(memory.result.current.read.getTree().nags[0].taskLog.version).toBe(0);
  });
});
