import type { NagPlanDto } from "@/api";
import { orderNaggersByDate } from "@/models";
import { nagPlanDtoToTree } from "@/services/model-conversion";
import type { Memory } from "@/services/memory";

export function importLoadedPlanToMemory(memory: Memory, nagPlanDto: NagPlanDto): void {
  const tree = nagPlanDtoToTree(nagPlanDto);
  const treeWithOrderedNaggers = orderNaggersByDate(tree);

  memory.write.setTree(treeWithOrderedNaggers);
}
