export type MiddlewareMetadata = Readonly<Record<string, string>>;

export type MiddlewareExecutionContext = {
  readonly causalityKey: string;
  readonly metadata?: MiddlewareMetadata;
};

export type MiddlewareWrapperFunction = <TResult>(
  context: MiddlewareExecutionContext,
  run: () => TResult,
) => TResult;

export function runWithMiddleware<TResult>(
  causalityKey: string,
  run: (context: MiddlewareExecutionContext) => TResult,
  middlewareWrapperFunction: MiddlewareWrapperFunction,
  metadata?: MiddlewareMetadata,
): TResult {
  const context = metadata === undefined ? { causalityKey } : { causalityKey, metadata };

  return middlewareWrapperFunction(context, () => run(context));
}

export const runWithoutMiddleware: MiddlewareWrapperFunction = (_context, run) => run();
