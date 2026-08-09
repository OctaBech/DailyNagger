import "@/debug/whyDidYouRender";
import "react-native-get-random-values";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import { ServiceProvider } from "@/services";
import { AppErrorBoundary, AppShell } from "@/app-shell";
import { ApiQueryProvider } from "@/api/react-query";
import { Stack } from "expo-router";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";

const App = () => {
  return (
    <SafeAreaProvider>
      <PaperProvider
        settings={{
          icon: (props) => <MaterialDesignIcons {...props} />,
        }}
      >
        <ApiQueryProvider>
          <ServiceProvider>
            <AppShell>
              <AppErrorBoundary>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "slide_from_right",
                  }}
                />
              </AppErrorBoundary>
            </AppShell>
          </ServiceProvider>
        </ApiQueryProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;
