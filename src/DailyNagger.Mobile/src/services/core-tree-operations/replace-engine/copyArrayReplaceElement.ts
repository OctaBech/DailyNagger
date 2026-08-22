import type { ReplaceContext, ReplaceResult } from "./contracts";

type CopyArrayReplaceElementResult<T> = { readonly indexFound: number; readonly newArray: T[] };

export function copyArrayReplaceElement<T>(
  replaceContext: ReplaceContext,
  ownerNode: { clientProps?: { indexHint?: number } },
  array: readonly T[],
  shouldTryReplace: (element: T) => boolean,
  replaceElement: (element: T) => ReplaceResult<T>,
): CopyArrayReplaceElementResult<T> {
  const replaceAll = replaceContext.action === "replace-all";

  const newArray: T[] = new Array(array.length);

  const indexHint = getIndexHint(ownerNode, array.length);

  return replaceAll
    ? replaceAllElementsInArray(array, newArray, indexHint, replaceElement)
    : replaceSpecificNode(array, newArray, indexHint, shouldTryReplace, replaceElement);
}

function replaceAllElementsInArray<T>(
  array: readonly T[],
  newArray: T[],
  indexHint: number,
  replaceElement: (element: T) => ReplaceResult<T>,
): CopyArrayReplaceElementResult<T> {
  for (let i = 0; i < array.length; i++) {
    const element = array[i];

    const { element: newElement } = replaceElement(element);
    newArray[i] = newElement;
  }

  // replace-all has no target index. Keep the existing hint so a later target replace
  // can still try the same likely child before falling back to id search.
  const indexFound = indexHint;

  return { indexFound, newArray };
}

function replaceSpecificNode<T>(
  array: readonly T[],
  newArray: T[],
  indexHint: number,
  shouldTryReplace: (element: T) => boolean,
  replaceElement: (element: T) => ReplaceResult<T>,
): CopyArrayReplaceElementResult<T> {
  let indexFound = -1;

  for (let i = 0; i < array.length; i++) {
    const index = getIndex(i, indexHint);

    const element = array[index];

    if (indexFound === -1 && shouldTryReplace(element)) {
      const { found, element: newElement } = replaceElement(element);
      if (found) {
        indexFound = index;
        newArray[index] = newElement;
      } else {
        newArray[index] = element;
      }
    } else {
      newArray[index] = element;
    }
  }
  return { indexFound, newArray };
}

function getIndexHint(node: { clientProps?: { indexHint?: number } }, arrayLength: number): number {
  const indexHint = node.clientProps?.indexHint;
  if (indexHint === undefined) return 0;
  if (indexHint >= arrayLength) return 0;
  return indexHint;
}

function getIndex(loopIndex: number, indexHint: number) {
  if (loopIndex > indexHint) return loopIndex;
  if (loopIndex === 0) return indexHint;
  return loopIndex - 1;
}
