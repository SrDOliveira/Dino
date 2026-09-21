import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

export function DuoduoMascot({ size = 72 }: { size?: number }) {
  return <View style={[styles.wrap, { width: size, height: size }]}><Image source={require("../assets/images/dino-commander.png")} style={{ width: size, height: size }} contentFit="contain" accessibilityLabel="Dino, o mascote tático" /></View>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
});
