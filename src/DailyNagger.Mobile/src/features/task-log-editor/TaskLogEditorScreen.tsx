import type { Guid } from "@/shared";
import { StyleSheet, View } from "react-native";
import { useEditorScreenCommands, useEditorScreenData } from "@/services";
import { useEffect } from "react";
import { NagList } from "./NagList";
import { nagPlanTheme } from "./theme";

type TaskLogEditorScreenProps = {
  naggerId: Guid | null;
};

export const TaskLogEditorScreen = (props: TaskLogEditorScreenProps) => {
  const { effects } = useEditorScreenCommands();
  const editorScreenData = useEditorScreenData();
  const { startEdit } = effects;

  useEffect(() => {
    startEdit(props.naggerId);
  }, [props.naggerId, startEdit]);

  if (editorScreenData.tree === null) return <View />;

  return (
    <View style={styles.screen}>
      <NagList nags={editorScreenData.tree.nags} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: nagPlanTheme.screen.background,
    flex: 1,
  },
});
