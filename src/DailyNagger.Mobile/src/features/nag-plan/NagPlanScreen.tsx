import { StyleSheet, View } from "react-native";
import { Primitives } from "@/components";
import { appVariant } from "@/config/appVariant";
import { nagPlanTheme } from "./theme";
import { NagList } from "./list";
import { usePlanScreenData } from "@/services";

const isDemo = appVariant === "demo";

export const NagPlanScreen = () => {
  const { nags, scroll, startup } = usePlanScreenData();

  return (
    <View style={styles.screen}>
      {startup.hasBlockingState && startup.stateScreenProps !== null ? (
        <Primitives.StateScreen {...startup.stateScreenProps} />
      ) : !startup.isReady ? (
        <Primitives.StateScreen
          title="Starting DailyNagger"
          message={isDemo ? "Demo mode" : undefined}
          highlightMessage={isDemo}
          showSpinner
        />
      ) : (
        <NagList
          nags={nags}
          getScrollOffset={scroll.getOffset}
          setScrollOffset={scroll.setOffset}
          topPadding={0}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: nagPlanTheme.screen.background,
    flex: 1,
  },
});
