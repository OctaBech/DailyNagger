import { appLayout, appMotion } from "@/config";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useModalKeyboardBoundary,
  type ModalKeyboardBoundaryOwner,
} from "@/app-shell/modal-keyboard-boundary";
import { modalTheme } from "./theme";
import { SheetHeader } from "./SheetHeader";
import { SheetInputFocusContext, useSheetKeyboardLift } from "./useSheetKeyboardLift";

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
  const {
    animation: keyboardSheetLiftAnimation,
    inputFocus,
    onOpened,
  } = useSheetKeyboardLift(visible);

  useEffect(() => {
    if (!visible) return;

    beginModalKeyboardBoundary(owner);
    return () => endModalKeyboardBoundary(owner);
  }, [beginModalKeyboardBoundary, endModalKeyboardBoundary, owner, visible]);

  useEffect(() => {
    if (!visible) return;

    openAnimation.setValue(0);
    const opening = Animated.timing(openAnimation, {
      duration: appMotion.sheetModal.openDurationMs,
      toValue: 1,
      useNativeDriver: true,
    });
    opening.start(({ finished }) => {
      if (finished) onOpened();
    });
    return () => opening.stop();
  }, [onOpened, openAnimation, visible]);

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
        <SheetInputFocusContext.Provider value={inputFocus}>
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
        </SheetInputFocusContext.Provider>
      </View>
    </Modal>
  );
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
    paddingHorizontal: modalTheme.sheet.contentPaddingHorizontal,
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
  footer: {
    borderTopColor: modalTheme.sheet.footerBorder,
    borderTopWidth: 1,
    paddingTop: 12,
  },
});
