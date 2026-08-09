type RenderFrameCounter = {
  count: number;
};

let currentFrameId = 0;
let currentFrameLabel: string | null = null;
const counters = new Map<string, RenderFrameCounter>();

export function startDebugRenderFrame(label: string): void {
  if (!__DEV__) return;

  currentFrameId += 1;
  currentFrameLabel = label;
  counters.clear();
}

export function useDebugRenderFrameCounter(componentName: string, id: string): void {
  if (!__DEV__ || currentFrameLabel === null) return;

  const key = `${componentName}:${id}`;
  const current = counters.get(key) ?? { count: 0 };
  const count = current.count + 1;

  counters.set(key, { count });

  console.log(
    `[debug-render-frame] x${count} ${componentName}:${id} during ${currentFrameLabel} (#${currentFrameId}).`,
  );
}
