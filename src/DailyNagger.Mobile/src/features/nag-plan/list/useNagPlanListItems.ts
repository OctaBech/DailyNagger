import { useMemo, useState } from "react";
import type { Nagger } from "@/models/clientModel";
import { getHolidays } from "@/holidays";
import { getCurrentAppDate } from "@/app-day";
import { zipNaggersAndHolidays } from "./zipNaggersAndHolidays";
import { cutAfterLastNagger } from "./cutAfterLastNagger";
import { buildNagPlanListItems } from "./buildNagPlanListItems";
import { filterNaggersByTitle } from "./filter/filterNaggersByTitle";

export function useNagPlanListItems(naggers: readonly Nagger[], query = "") {
  const [holidays] = useState(() => {
    const today = getCurrentAppDate();
    const endDate = `${Number(today.slice(0, 4)) + 1}${today.slice(4)}`;
    return getHolidays("DK", today).filter(({ date }) => date < endDate);
  });
  const filterIsActive = query.trim().length > 0;
  const filteredNaggers = useMemo(() => filterNaggersByTitle(naggers, query), [naggers, query]);
  const entries = useMemo(
    () => zipNaggersAndHolidays(filteredNaggers, holidays),
    [filteredNaggers, holidays],
  );

  return useMemo(
    () => buildNagPlanListItems(filterIsActive ? cutAfterLastNagger(entries) : entries),
    [entries, filterIsActive],
  );
}
