import { runWithMiddleware, type MiddlewareWrapperFunction } from "@/middleware";

type ValueArgs = { value: number };
const run = (args: ValueArgs) => args.value;
const wrapper: MiddlewareWrapperFunction<ValueArgs> = (_args, execute) => execute();

export const result = runWithMiddleware(run, wrapper, { value: 42 });
export const directResult = runWithMiddleware(run, undefined, { value: 42 });
export const asyncResult = runWithMiddleware(async (args: ValueArgs) => args.value, wrapper, {
  value: 42,
});

type Expect<T extends true> = T;
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export type WrappedResultIsNumber = Expect<Equal<typeof result, number>>;
export type DirectResultIsNumber = Expect<Equal<typeof directResult, number>>;
export type AsyncResultIsPromise = Expect<Equal<typeof asyncResult, Promise<number>>>;

// @ts-expect-error The arguments must match the function's input type.
runWithMiddleware(run, undefined, { value: "wrong type" });

const wrongWrapper = (_args: { label: string }, execute: () => number) => execute();
// @ts-expect-error The wrapper must accept the same arguments as the function.
runWithMiddleware(run, wrongWrapper, { value: 42 });

const wrongReturnWrapper = (_args: ValueArgs, _execute: () => number) => "wrong result";
// @ts-expect-error The wrapper must preserve the function's return type.
runWithMiddleware(run, wrongReturnWrapper, { value: 42 });
