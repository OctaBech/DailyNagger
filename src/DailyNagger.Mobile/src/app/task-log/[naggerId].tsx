import { TaskLogEditorScreen } from "@/features/task-log-editor";
import type { Guid } from "@/shared";
import { useLocalSearchParams } from "expo-router";

export default function TaskLogRoute() {
  const { naggerId } = useLocalSearchParams<{ naggerId: Guid }>();

  return <TaskLogEditorScreen naggerId={naggerId} />;
}
