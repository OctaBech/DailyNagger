export type MiddlewareExecutionContext = {
  readonly causalityKey: string;
};

export type ExecutionMiddleware<TContext extends MiddlewareExecutionContext> = <TResult>(
  context: TContext,
  run: () => TResult,
) => TResult;

export type AsyncExecutionMiddleware<TContext extends MiddlewareExecutionContext> = <TResult>(
  context: TContext,
  run: () => Promise<TResult>,
) => Promise<TResult>;

export function runWithOptionalMiddleware<TContext extends MiddlewareExecutionContext, TResult>(
  middleware: ExecutionMiddleware<TContext> | undefined,
  context: TContext,
  run: () => TResult,
): TResult;
export function runWithOptionalMiddleware<TContext extends MiddlewareExecutionContext, TResult>(
  middleware: AsyncExecutionMiddleware<TContext> | undefined,
  context: TContext,
  run: () => Promise<TResult>,
): Promise<TResult>;
export function runWithOptionalMiddleware<TContext extends MiddlewareExecutionContext, TResult>(
  middleware:
    | ((context: TContext, run: () => TResult) => TResult)
    | ((context: TContext, run: () => Promise<TResult>) => Promise<TResult>)
    | undefined,
  context: TContext,
  run: (() => TResult) | (() => Promise<TResult>),
): TResult | Promise<TResult> {
  if (middleware === undefined) return run();

  return middleware(context, run as () => TResult & Promise<TResult>);
}
