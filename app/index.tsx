import { ActivityIndicator, View, Text } from "react-native";
import { Redirect } from "expo-router";

import { useStudy } from "@/lib/study-store";

export default function IndexScreen() {
  const { state, isHydrated } = useStudy();

  if (!isHydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F8F3",
        }}
      >
        <ActivityIndicator size="large" color="#39B54A" />
        <Text style={{ marginTop: 12, color: "#666", fontSize: 14 }}>Carregando seu progresso...</Text>
      </View>
    );
  }

  return (
    <Redirect
      href={(state.hasCompletedOnboarding ? "/(tabs)" : "/onboarding") as any}
    />
  );
}
