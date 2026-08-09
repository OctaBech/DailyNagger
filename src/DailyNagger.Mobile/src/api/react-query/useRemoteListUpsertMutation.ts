import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

type UseRemoteListUpsertMutationProps<TItem, TVariables, TKey> = {
  readonly queryKey: QueryKey;
  readonly mutationFn: (variables: TVariables) => Promise<TItem>;
  readonly getItemKey: (item: TItem) => TKey;
};

export function useRemoteListUpsertMutation<TItem, TVariables, TKey>({
  queryKey,
  mutationFn,
  getItemKey,
}: UseRemoteListUpsertMutationProps<TItem, TVariables, TKey>) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    onSuccess: (savedItem) => {
      queryClient.setQueryData<readonly TItem[]>(queryKey, (currentItems = []) => [
        savedItem,
        ...currentItems.filter((item) => getItemKey(item) !== getItemKey(savedItem)),
      ]);
    },
  });

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
  };
}
