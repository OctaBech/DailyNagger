import { useModalKeyboardBoundary } from "@/app-shell";
import { appLayout, appMotion } from "@/config";
import { useEffect, createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Keyboard, Modal, Pressable, StyleSheet, View } from "react-native";
import type { KeyboardEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ModalKeyboardBoundaryOwner } from "@/app-shell";
import { modalTheme } from "./theme";
import { SheetHeader } from "./SheetHeader";

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
            <SheetHeader
              action={headerActionPlacement === "title-row" ? headerAction : null}
              title={title}
              onDismiss={onDismiss}
            />
            {headerAction === undefined || headerActionPlacement === "title-row" ? null : (
              <View style={styles.headerActions}>{headerAction}</View>
            )}
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
    backgroundColor: modalTheme.sheet.backdrop,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: modalTheme.sheet.background,
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
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  keyboardLiftRegion: {
    gap: 12,
  },
  footer: {
    borderTopColor: modalTheme.sheet.footerBorder,
    borderTopWidth: 1,
    paddingTop: 12,
  },
});
