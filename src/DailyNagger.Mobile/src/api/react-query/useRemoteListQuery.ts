import { appTiming } from "@/config";
import { useQuery, type QueryKey } from "@tanstack/react-query";

type UseRemoteListQueryProps<TItem> = {
  readonly queryKey: QueryKey;
  readonly queryFn: () => Promise<readonly TItem[]>;
};

export function useRemoteListQuery<TItem>({
  queryKey,
  queryFn,
}: UseRemoteListQueryProps<TItem>) {
  const query = useQuery({
    queryKey,
    queryFn,
    staleTime: appTiming.reactQuery.remoteListStaleTimeMs,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    hasLoadError: query.isError || query.isRefetchError,
  };
}
