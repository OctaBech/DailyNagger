import { useModalKeyboardBoundary } from "@/app-shell";
import { appLayout, appMotion } from "@/config";
import { useEffect, createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Keyboard, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { KeyboardEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ModalKeyboardBoundaryOwner } from "@/app-shell";

type SheetModalProps = {
  readonly visible: boolean;
  readonly owner: ModalKeyboardBoundaryOwner;
  readonly title: string;
  readonly onDismiss: () => void;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly headerAction?: ReactNode;
  readonly headerActionPlacement?: "title-row" | "below-title";
};

const SheetModalContext = createContext(false);

export function SheetModal({
  visible,
  owner,
  title,
  onDismiss,
  children,
  footer,
  headerAction,
  headerActionPlacement = "below-title",
}: SheetModalProps) {
  const { bottom } = useSafeAreaInsets();
  const { beginModalKeyboardBoundary, endModalKeyboardBoundary } = useModalKeyboardBoundary();
  const [openAnimation] = useState(() => new Animated.Value(0));
  const [keyboardSheetLiftAnimation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;

    beginModalKeyboardBoundary(owner);
    return () => endModalKeyboardBoundary(owner);
  }, [beginModalKeyboardBoundary, endModalKeyboardBoundary, owner, visible]);

  useEffect(() => {
    if (!visible) return;

    openAnimation.setValue(0);
    Animated.timing(openAnimation, {
      duration: appMotion.sheetModal.openDurationMs,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [openAnimation, visible]);

  useEffect(() => {
    if (!visible) return;

    function animateSheetKeyboardLift(toValue: number) {
      Animated.timing(keyboardSheetLiftAnimation, {
        duration: appMotion.sheetModal.keyboardSheetLiftDurationMs,
        toValue,
        useNativeDriver: true,
      }).start();
    }

    function showKeyboard(event: KeyboardEvent) {
      const liftDistance = Math.min(
        event.endCoordinates.height * appMotion.sheetModal.keyboardSheetLiftHeightRatio,
        appMotion.sheetModal.keyboardSheetLiftMaxTranslateY,
      );

      animateSheetKeyboardLift(-liftDistance);
    }

    const showSubscription = Keyboard.addListener("keyboardDidShow", showKeyboard);
    const frameSubscription = Keyboard.addListener("keyboardDidChangeFrame", showKeyboard);
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => animateSheetKeyboardLift(0));

    return () => {
      showSubscription.remove();
      frameSubscription.remove();
      hideSubscription.remove();
    };
  }, [keyboardSheetLiftAnimation, visible]);

  const backdropOpacity = openAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, appMotion.sheetModal.backdropOpacity],
  });
  const sheetTranslateY = openAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [appMotion.sheetModal.openFromOffscreenTranslateY, 0],
  });
  const sheetModalTranslateY = Animated.add(sheetTranslateY, keyboardSheetLiftAnimation);

  return (
    <Modal visible={visible} transparent onDismiss={onDismiss} onRequestClose={onDismiss}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onDismiss}>
          <Animated.View style={[styles.backdropScrim, { opacity: backdropOpacity }]} />
        </Pressable>
        <SheetModalContext.Provider value>
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(appLayout.sheetModal.minBottomPadding, bottom + 12),
                transform: [{ translateY: sheetModalTranslateY }],
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              {headerActionPlacement === "title-row" ? headerAction : null}
            </View>
            {headerAction === undefined || headerActionPlacement === "title-row" ? null : (
              <View style={styles.headerActions}>{headerAction}</View>
            )}
            <Pressable style={styles.closeButton} onPress={onDismiss}>
              <View style={[styles.closeIconLine, styles.closeIconLineForward]} />
              <View style={[styles.closeIconLine, styles.closeIconLineBackward]} />
            </Pressable>
            {children}
            {footer === undefined ? null : <View style={styles.footer}>{footer}</View>}
          </Animated.View>
        </SheetModalContext.Provider>
      </View>
    </Modal>
  );
}

type KeyboardLiftRegionProps = {
  readonly children: ReactNode;
};

export function KeyboardLiftRegion({ children }: KeyboardLiftRegionProps) {
  const isInsideSheetModal = useContext(SheetModalContext);

  if (!isInsideSheetModal) {
    throw new Error("KeyboardLiftRegion must be used inside SheetModal.");
  }

  return <View style={styles.keyboardLiftRegion}>{children}</View>;
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
  },
  backdropScrim: {
    backgroundColor: "#000",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: "#f8f4ef",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    bottom: 0,
    gap: 14,
    left: 0,
    maxHeight: "82%",
    paddingHorizontal: 16,
    paddingTop: 18,
    position: "absolute",
    right: 0,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  title: {
    color: "#18242b",
    flexGrow: 1,
    flexShrink: 1,
    fontSize: 22,
    fontWeight: "900",
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#f8f4ef",
    borderColor: "#d8d1c9",
    borderRadius: 22,
    borderWidth: 1,
    elevation: 4,
    justifyContent: "center",
    height: 44,
    position: "absolute",
    right: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    top: -18,
    width: 44,
  },
  closeIconLine: {
    backgroundColor: "#51636d",
    borderRadius: 2,
    height: 4,
    position: "absolute",
    width: 28,
  },
  closeIconLineForward: {
    transform: [{ rotate: "45deg" }],
  },
  closeIconLineBackward: {
    transform: [{ rotate: "-45deg" }],
  },
  keyboardLiftRegion: {
    gap: 12,
  },
  footer: {
    borderTopColor: "#ddd6cf",
    borderTopWidth: 1,
    paddingTop: 12,
  },
});
