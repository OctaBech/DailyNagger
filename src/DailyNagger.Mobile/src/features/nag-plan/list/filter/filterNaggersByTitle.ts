import type { Nagger } from "@/models/clientModel";

export function filterNaggersByTitle(nags: readonly Nagger[], query: string): readonly Nagger[] {
  const search = query.trim().toLowerCase();
  if (search.length === 0) return nags;
  return nags.filter((nagger) => nagger.title.toLowerCase().includes(search));
}
