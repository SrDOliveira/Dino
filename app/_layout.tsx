import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import { View, ActivityIndicator } from "react-native";

import { ThemeProvider } from "@/lib/theme-provider";
import { StudyProvider } from "@/lib/study-store";
import { createTRPCClient, trpc } from "@/lib/trpc";
import { ErrorBoundary } from "@/components/error-boundary";
import { SubscriptionProvider } from "@/lib/subscription-store";

// Keep the splash screen visible while we bootstrap the app
SplashScreen.preventAutoHideAsync().catch(() => {
  /* already hidden or not available */
});

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Don't spam the network if offline or API is down
            retry: 1,
            staleTime: 30_000,
            // Fail quietly – core study features work offline
            throwOnError: false,
          },
          mutations: {
            retry: 0,
            throwOnError: false,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure providers are mounted, then hide splash
    const timer = setTimeout(async () => {
      setIsReady(true);
      try {
        await SplashScreen.hideAsync();
      } catch {
        // ignore
      }
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // While splash is still showing, render a minimal loading view
  // (this prevents flash of white content)
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#39B54A" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SubscriptionProvider>
            <StudyProvider>
              <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="leveling" />
                <Stack.Screen name="leveling-result" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="lesson" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="materials" options={{ animation: "slide_from_right" }} />
                <Stack.Screen name="paywall" options={{ animation: "slide_from_bottom", presentation: "modal" }} />
              </Stack>
            </StudyProvider>
            </SubscriptionProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  );
}
