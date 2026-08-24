import { fetchTags, saveTag } from "@/api";
import type { TagDto } from "@api-contracts";
import { useRemoteListQuery, useRemoteListUpsertMutation } from "@/api/react-query";
import type { Prettify } from "@/shared";
import type { TagType } from "./tagTypes";

type Tag = {
  readonly name: string;
  readonly description: string | null;
  readonly lastUsedAt: Date | null;
};

export type Tags = Prettify<ReturnType<typeof useTags>>;

export function useTags(tagType: TagType) {
  const queryKey = ["tags", tagType] as const;

  const tagsQuery = useRemoteListQuery({
    queryKey,
    queryFn: () => fetchTags(tagType),
  });

  const saveTagMutation = useRemoteListUpsertMutation<
    TagDto,
    Pick<Tag, "name" | "description">,
    string
  >({
    queryKey,
    mutationFn: (tag: Pick<Tag, "name" | "description">) =>
      saveTag(tagType, tag.name, tag.description),
    getItemKey: (tag) => tag.name,
  });

  const existingTags: readonly Tag[] = tagsQuery.items.map((tag) => ({
    ...tag,
    lastUsedAt: tag.lastUsedAt === null ? null : new Date(tag.lastUsedAt),
  }));

  return {
    existingTags,
    saveTag: saveTagMutation.mutate,
    isSavingTag: saveTagMutation.isPending,
    isLoadingExistingTags: tagsQuery.isLoading,
    hasExistingTagLoadError: tagsQuery.hasLoadError,
  };
}
