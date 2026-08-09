import { useServices } from "@/services";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

type AssistantBubbleLayout = "robot-outside" | "robot-inside";

const assistantBubbleLayout = "robot-outside" as AssistantBubbleLayout;
const robotEmoji = "\u{1F916}";

export const AssistantBubble = () => {
  const { assistantBubble } = useServices();

  useEffect(() => {
    if (!assistantBubble.hasMessage()) return;

    const timer = setTimeout(assistantBubble.dismiss, 4000);
    return () => clearTimeout(timer);
  }, [assistantBubble]);

  if (!assistantBubble.hasMessage()) return <></>;

  const bubbleKindStyle = [
    assistantBubble.isMessageKind("error") && styles.errorBubble,
    assistantBubble.isMessageKind("success") && styles.successBubble,
  ];

  return (
    <View style={styles.assistantBubbleRow}>
      {assistantBubbleLayout === "robot-outside" && (
        <View style={styles.robotBadge}>
          <Text style={styles.robot}>{robotEmoji}</Text>
        </View>
      )}
      <View style={[styles.bubble, bubbleKindStyle]}>
        {assistantBubbleLayout === "robot-inside" && (
          <Text style={styles.inlineRobot}>{robotEmoji}</Text>
        )}
        <Text selectable={false} style={styles.bubbleText}>
          {assistantBubble.getMessageText()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  assistantBubbleRow: {
    alignItems: "flex-end",
    bottom: 28,
    flexDirection: "row",
    gap: 8,
    left: 28,
    maxWidth: "78%",
    position: "absolute",
  },
  robotBadge: {
    alignItems: "center",
    backgroundColor: "#ffe38a",
    borderColor: "#f4bd3f",
    borderRadius: 24,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    shadowColor: "#060708",
    shadowOffset: { width: -2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    width: 48,
    elevation: 4,
  },
  robot: {
    fontSize: 32,
    lineHeight: 36,
    transform: [{ translateY: -2 }],
    userSelect: "none",
  },
  bubble: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#060708",
    shadowOffset: { width: -2, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 4,
  },
  errorBubble: {
    backgroundColor: "#8f1d1d",
  },
  successBubble: {
    backgroundColor: "#1f7a3a",
  },
  inlineRobot: {
    fontSize: 22,
    userSelect: "none",
  },
  bubbleText: {
    color: "#ffffff",
    fontWeight: "800",
  },
});
