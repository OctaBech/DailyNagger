export type MiddlewareMetadata = Readonly<Record<string, string>>;

export type MiddlewareExecutionContext = {
  readonly causalityKey: string;
  readonly metadata?: MiddlewareMetadata;
};

export type MiddlewareWrapperFunction<TArgs> = <TResult>(
  args: TArgs,
  run: () => TResult,
) => TResult;

export function runWithMiddleware<TArgs, TResult>(
  runFunc: (args: TArgs) => TResult,
  middlewareFunc: ((args: TArgs, run: () => NoInfer<TResult>) => NoInfer<TResult>) | undefined,
  args: TArgs,
): TResult {
  if (middlewareFunc) {
    return middlewareFunc(args, () => runFunc(args));
  }

  return runFunc(args);
}

export function runWithoutMiddleware<TArgs, TResult>(_args: TArgs, run: () => TResult): TResult {
  return run();
}
