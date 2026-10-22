import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Keyboard, StyleSheet, TextInput, View, type KeyboardEvent } from "react-native";
import { Icon, IconButton, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appLayout } from "@/config/appLayout";
import { appMotion } from "@/config/appMotion";
import { actionButtonTheme } from "@/components/primitives/actionButtonTheme";

type PlanFilterBarProps = {
  readonly query: string;
  readonly focusRequest: number;
  readonly onChangeText: (query: string) => void;
  readonly onFocusChange: (focused: boolean) => void;
  readonly onClose: () => void;
};

export function PlanFilterBar({
  query,
  focusRequest,
  onChangeText,
  onFocusChange,
  onClose,
}: PlanFilterBarProps) {
  const { bottom } = useSafeAreaInsets();
  const theme = useTheme();
  const input = useRef<TextInput>(null);
  const frame = useRef<View>(null);
  const keyboardTop = useRef<number | null>(Keyboard.metrics()?.screenY ?? null);
  const measurementVersion = useRef(0);
  const [keyboardIsVisible, setKeyboardIsVisible] = useState(Keyboard.isVisible());
  const [translateY] = useState(() => new Animated.Value(0));
  const invalidateMeasurements = useCallback(() => {
    measurementVersion.current++;
  }, []);
  // NagList is already inside AppShell's bottom safe area; the dial's Portal is not.
  const bottomOffset = Math.max(appLayout.speedDial.bottom, bottom + 12) - bottom;

  const updateLift = useCallback(
    (duration: number = appMotion.sheetModal.keyboardSheetLiftDurationMs) => {
      const version = ++measurementVersion.current;
      translateY.stopAnimation((currentLift) => {
        frame.current?.measureInWindow((_x, top, _width, height) => {
          if (version !== measurementVersion.current || frame.current === null || height <= 0)
            return;
          const unliftedBottom = top + height - currentLift;
          const overlap =
            keyboardTop.current === null
              ? 0
              : Math.max(0, unliftedBottom + 8 - keyboardTop.current);
          Animated.timing(translateY, {
            toValue: -overlap,
            duration,
            useNativeDriver: true,
          }).start();
        });
      });
    },
    [translateY],
  );

  useEffect(() => {
    const show = (event: KeyboardEvent) => {
      keyboardTop.current = event.endCoordinates.screenY;
      setKeyboardIsVisible(true);
      updateLift(event.duration || appMotion.sheetModal.keyboardSheetLiftDurationMs);
    };
    const hide = () => {
      keyboardTop.current = null;
      setKeyboardIsVisible(false);
      updateLift();
    };
    const subscriptions = [
      Keyboard.addListener("keyboardDidShow", show),
      Keyboard.addListener("keyboardDidChangeFrame", show),
      Keyboard.addListener("keyboardDidHide", hide),
    ];
    return () => {
      invalidateMeasurements();
      subscriptions.forEach((subscription) => subscription.remove());
      translateY.stopAnimation();
    };
  }, [invalidateMeasurements, translateY, updateLift]);

  useEffect(() => {
    input.current?.focus();
  }, [focusRequest]);

  return (
    <Animated.View
      ref={frame}
      onLayout={() => updateLift()}
      style={[
        styles.bar,
        {
          bottom: bottomOffset,
          borderRadius: theme.roundness * 4,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.searchIcon}>
        <Icon source="magnify" size={22} color={actionButtonTheme.icon} />
      </View>
      <TextInput
        ref={input}
        value={query}
        onChangeText={onChangeText}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        onSubmitEditing={Keyboard.dismiss}
        placeholder="Filter tasks…"
        accessibilityLabel="Filter tasks by title"
        placeholderTextColor={actionButtonTheme.icon}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="done"
        style={styles.input}
      />
      <IconButton
        icon="close"
        iconColor={actionButtonTheme.icon}
        accessibilityLabel="Clear and close task filter"
        onPress={onClose}
        style={styles.button}
      />
      {/* Reserve the dial's footprint at rest; only the bar lifts above the keyboard. */}
      <View style={styles.dialSlot}>
        {keyboardIsVisible && (
          <IconButton
            icon="chevron-down"
            iconColor={actionButtonTheme.icon}
            accessibilityLabel="Hide keyboard"
            onPress={Keyboard.dismiss}
            style={styles.button}
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: appLayout.speedDial.right,
    right: appLayout.speedDial.right,
    height: appLayout.speedDial.mainSize,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: actionButtonTheme.background,
    elevation: 4,
  },
  searchIcon: { paddingLeft: 12, paddingRight: 8 },
  input: { flex: 1, minWidth: 0, height: "100%", fontSize: 16, color: actionButtonTheme.icon },
  button: { margin: 0 },
  dialSlot: { width: appLayout.speedDial.mainSize, alignItems: "center" },
});
