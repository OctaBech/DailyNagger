import { StyleSheet, Text, View } from "react-native";
import type { SelectedNodes } from "@/models";

type SelectedNodeDebugProps = {
  readonly selectedNodes: SelectedNodes;
};

export const SelectedNodeDebug = ({ selectedNodes }: SelectedNodeDebugProps) => {
  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <Text selectable={false} style={styles.text}>
        {[
          `type:${selectedNodes.selectedNodeType ?? "null"}`,
          `n:${formatId(selectedNodes.nagger?.id)}`,
          `l:${formatId(selectedNodes.taskLog?.id)}`,
          `i:${formatId(selectedNodes.taskItem?.id)}`,
          `e:${formatId(selectedNodes.taskEntry?.id)}`,
        ].join(" ")}
      </Text>
    </View>
  );
};

function formatId(id: string | undefined): string {
  if (id === undefined) return "-";

  return id.slice(0, 4);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#101214",
    borderColor: "#6d7378",
    borderRadius: 6,
    borderWidth: 1,
    marginHorizontal: 24,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  text: {
    color: "#d7dde1",
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: "700",
  },
});
