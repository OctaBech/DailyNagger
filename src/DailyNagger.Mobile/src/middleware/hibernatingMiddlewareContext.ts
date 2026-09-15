export type HibernatingMiddleware<TContext, TResult> = {
  readonly hibernateMiddlewareContext?: () => TContext;
  readonly wakeMiddlewareContext?: (
    middlewareContexts: readonly TContext[],
    run: () => Promise<TResult>,
  ) => Promise<TResult>;
};

export function hibernateMiddlewareContext<TContext>(
  middleware: Pick<HibernatingMiddleware<TContext, unknown>, "hibernateMiddlewareContext"> | undefined,
): TContext | null {
  return middleware?.hibernateMiddlewareContext?.() ?? null;
}

export function runWithAwakenedMiddlewareContext<TContext, TResult>(
  middleware: Pick<HibernatingMiddleware<TContext, TResult>, "wakeMiddlewareContext"> | undefined,
  middlewareContexts: readonly TContext[],
  run: () => Promise<TResult>,
): Promise<TResult> {
  return middleware?.wakeMiddlewareContext?.(middlewareContexts, run) ?? run();
}
