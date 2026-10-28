import "react-native-get-random-values";
import { v7 as uuidv7 } from "uuid";

export type Guid = string;

export function newGuid(): Guid {
  return uuidv7();
}
