import { View } from "react-native";

export function ProgressBar({ value, color = "#39B54A", height = 8 }: { value: number; color?: string; height?: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: "#E6EDE5", overflow: "hidden" }}>
      <View style={{ width: `${safeValue}%`, height: "100%", borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}
