import { describe, expect, it, jest } from "@jest/globals";
import {
  runWithMiddleware,
  type MiddlewareExecutionContext,
  type MiddlewareWrapperFunction,
} from "@/middleware";

describe("runWithMiddleware", () => {
  it("calls the function once and returns its result when no wrapper is supplied", () => {
    const result = { value: "saved" };
    const run = jest.fn(() => result);

    expect(runWithMiddleware(run, undefined, { causalityKey: "action/save" })).toBe(result);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith({ causalityKey: "action/save" });
  });

  it("passes metadata to the function when the wrapper is undefined", () => {
    const metadata = { actionKey: "taskEntry.setValue" };
    const run = jest.fn(() => undefined);

    runWithMiddleware(run, undefined, { causalityKey: "action/save", metadata });

    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith({ causalityKey: "action/save", metadata });
  });

  it("lets the wrapper surround the call and shares the same context with the function", () => {
    const steps: string[] = [];
    const metadata = { actionKey: "taskEntry.setValue" };
    const result = { value: "saved" };
    const run = jest.fn<(context: MiddlewareExecutionContext) => typeof result>(() => {
      steps.push("action");
      return result;
    });
    const wrapper: MiddlewareWrapperFunction<MiddlewareExecutionContext> = (context, execute) => {
      expect(context).toEqual({ causalityKey: "action/save", metadata });
      steps.push("before");
      const returnedValue = execute();
      expect(run).toHaveBeenCalledWith(context);
      expect(run.mock.calls[0]?.[0]).toBe(context);
      steps.push("after");
      return returnedValue;
    };

    expect(runWithMiddleware(run, wrapper, { causalityKey: "action/save", metadata })).toBe(result);
    expect(run).toHaveBeenCalledTimes(1);
    expect(steps).toEqual(["before", "action", "after"]);
  });

  it("propagates the original error when no wrapper is supplied", () => {
    const error = new Error("Save failed");
    const run = () => {
      throw error;
    };

    expect(() => runWithMiddleware(run, undefined, {})).toThrow(error);
  });

  it("returns the original promise when no wrapper is supplied", async () => {
    const promise = Promise.resolve("saved");

    const result = runWithMiddleware(() => promise, undefined, {});

    expect(result).toBe(promise);
    await expect(result).resolves.toBe("saved");
  });

  it("accepts batch arguments without requiring a causality key or metadata", async () => {
    const batch = { middlewareContexts: [{ trace: "saved-trace" }], parcels: ["parcel"] };
    const run = jest.fn<(args: typeof batch) => Promise<string>>(() => Promise.resolve("sent"));
    const wrapper = jest.fn((args: typeof batch, execute: () => Promise<string>) => {
      expect(args).toBe(batch);
      return execute();
    });

    await expect(runWithMiddleware(run, wrapper, batch)).resolves.toBe("sent");

    expect(wrapper).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0]?.[0]).toBe(batch);
  });
});
