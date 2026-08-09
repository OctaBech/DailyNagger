import type { NagPlanDto } from "@/api";
import { nagPlanDtoToTree } from "@/services/model-conversion";
import { orderNaggersByDate } from "@/services/operations";
import type { Memory } from "../memory";

export function importLoadedPlanToMemory(memory: Memory, nagPlanDto: NagPlanDto): void {
  const tree = nagPlanDtoToTree(nagPlanDto);
  const treeWithOrderedNaggers = orderNaggersByDate(tree);

  memory.write.setTree(treeWithOrderedNaggers);
}
