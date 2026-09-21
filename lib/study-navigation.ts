export const studyNavDestinations = [
  { label: "Arena", icon: "home" as const, route: "/(tabs)" },
  { label: "Trilha", icon: "map" as const, route: "/(tabs)/trail" },
  { label: "Diagnóstico", icon: "insights" as const, route: "/(tabs)/diagnosis" },
  { label: "Perfil", icon: "person" as const, route: "/(tabs)/profile" },
] as const;
