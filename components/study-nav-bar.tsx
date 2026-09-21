import { Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";

import { haptic } from "@/lib/haptics";
import { studyNavDestinations } from "@/lib/study-navigation";

export function StudyNavBar() {
  return <View style={styles.bar}>{studyNavDestinations.map((destination) => <Pressable key={destination.label} onPress={() => { haptic.light(); router.replace(destination.route as never); }} style={({ pressed }) => [styles.item, pressed && styles.pressed]}><MaterialIcons name={destination.icon} size={20} color="#52705A" /><Text style={styles.label}>{destination.label}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 8, borderRadius: 17, borderWidth: 1, borderColor: "#DFE9E0", backgroundColor: "#FFFFFF" },
  item: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", gap: 2 },
  label: { color: "#52705A", fontSize: 10, fontWeight: "800" },
  pressed: { opacity: 0.68 },
});
