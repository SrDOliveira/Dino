import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { haptic } from "@/lib/haptics";

export function PrimaryButton({ label, onPress, variant = "primary", disabled = false, style }: { label: string; onPress: () => void; variant?: "primary" | "secondary"; disabled?: boolean; style?: ViewStyle; }) {
  const secondary = variant === "secondary";
  return (
    <Pressable disabled={disabled} onPress={() => { haptic.light(); onPress(); }} style={({ pressed }) => [styles.button, secondary ? styles.secondary : styles.primary, disabled && styles.disabled, pressed && !disabled && styles.pressed, style]}>
      <Text style={[styles.label, secondary ? styles.secondaryLabel : styles.primaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primary: { backgroundColor: "#39B54A", shadowColor: "#217B2B", shadowOpacity: 0.22, shadowRadius: 8, elevation: 2 },
  secondary: { backgroundColor: "#FFFFFF", borderColor: "#CFE0D0", borderWidth: 1 },
  label: { fontSize: 16, fontWeight: "800" }, primaryLabel: { color: "#FFFFFF" }, secondaryLabel: { color: "#1F5130" },
  disabled: { opacity: 0.45 }, pressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
});
