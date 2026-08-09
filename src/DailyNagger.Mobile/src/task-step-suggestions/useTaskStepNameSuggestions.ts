import { fetchTaskStepNameSuggestions } from "@/api";
import { useRemoteListQuery } from "@/api/react-query";
import type { Guid, Prettify } from "@/shared";

type TaskStepNameSuggestion = {
  readonly name: string;
};

export type TaskStepNameSuggestions = Prettify<
  ReturnType<typeof useTaskStepNameSuggestions>
>;

export function useTaskStepNameSuggestions(naggerId: Guid) {
  const suggestionsQuery = useRemoteListQuery({
    queryKey: ["task-step-name-suggestions", naggerId],
    queryFn: () => fetchTaskStepNameSuggestions(naggerId),
  });

  const suggestions: readonly TaskStepNameSuggestion[] = suggestionsQuery.items;

  return {
    suggestions,
    isLoadingSuggestions: suggestionsQuery.isLoading,
    hasSuggestionLoadError: suggestionsQuery.hasLoadError,
  };
}
