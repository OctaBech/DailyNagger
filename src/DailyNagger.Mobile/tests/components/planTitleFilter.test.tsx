import { describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import { Keyboard } from "react-native";
import type { ReactNode } from "react";
import type { Nagger } from "@/models/clientModel";
import { createEventEmitter } from "@/shared/useEventEmitter";
import { PlanFilterRequestsProvider } from "@/features/nag-plan/filter/PlanFilterRequests";
import { usePlanTitleFilter } from "@/features/nag-plan/filter/usePlanTitleFilter";
import { filterNaggersByTitle } from "@/features/nag-plan/filter/filterNaggersByTitle";

describe("plan title filtering", () => {
  const gym = { title: "Gym [A]", pinnedBy: "User", clientProps: { isSelected: true } } as Nagger;
  const shopping = { title: "Groceries", taskLog: { tag: "gym" } } as Nagger;
  const nags = [gym, shopping];

  it("preserves the original list when no filter is active", () => {
    expect(filterNaggersByTitle(nags, "")).toBe(nags);
    expect(filterNaggersByTitle(nags, "  ")).toBe(nags);
  });

  it("matches titles case-insensitively, including pinned cards, without changing selection", () => {
    expect(filterNaggersByTitle(nags, " gYm ")).toEqual([gym]);
    expect(filterNaggersByTitle(nags, "gym")[0]).toBe(gym);
    expect(gym.clientProps.isSelected).toBe(true);
  });

  it("treats search characters literally and does not search tags or children", () => {
    expect(filterNaggersByTitle(nags, "[a]")).toEqual([gym]);
    expect(filterNaggersByTitle([shopping], "gym")).toEqual([]);
    expect(filterNaggersByTitle(nags, "absent")).toEqual([]);
  });

  it("opens through an event but keeps typing local, without rerendering the shell", async () => {
    const requests = createEventEmitter<"open", void>();
    let shellRenders = 0;
    const { result } = await renderHook(() => usePlanTitleFilter(), {
      wrapper: ({ children }: { children: ReactNode }) => {
        shellRenders++;
        return <PlanFilterRequestsProvider value={requests}>{children}</PlanFilterRequestsProvider>;
      },
    });
    const initialShellRenders = shellRenders;
    await act(async () => requests.emit("open", undefined));
    expect(result.current.isVisible).toBe(true);
    await act(async () => result.current.setQuery("gym"));
    await act(async () => result.current.setIsInputFocused(false));
    expect(result.current.query).toBe("gym");
    expect(result.current.isVisible).toBe(true);
    expect(shellRenders).toBe(initialShellRenders);

    const firstFocusRequest = result.current.focusRequest;
    await act(async () => requests.emit("open", undefined));
    expect(result.current.focusRequest).toBe(firstFocusRequest + 1);
    expect(result.current.query).toBe("gym");
  });

  it("clears and closes on X, and unsubscribes when leaving the plan screen", async () => {
    const dismiss = jest.spyOn(Keyboard, "dismiss").mockImplementation(() => undefined);
    const requests = createEventEmitter<"open", void>();
    const { result, unmount } = await renderHook(() => usePlanTitleFilter(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <PlanFilterRequestsProvider value={requests}>{children}</PlanFilterRequestsProvider>
      ),
    });
    await act(async () => requests.emit("open", undefined));
    await act(async () => result.current.setQuery("gym"));
    await act(async () => result.current.close());
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(result.current.isVisible).toBe(false);
    expect(result.current.query).toBe("");
    await unmount();
    requests.emit("open", undefined);
    dismiss.mockRestore();
  });
});
