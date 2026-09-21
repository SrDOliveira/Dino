import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home", "book.closed.fill": "menu-book", "chart.bar.fill": "bar-chart", "person.fill": "person", "trophy.fill": "emoji-events", "flame.fill": "local-fire-department", "bolt.fill": "bolt", "brain.head.profile": "psychology", "folder.fill": "folder", "arrow.right": "arrow-forward", "lock.fill": "lock", "chevron.right": "chevron-right", "chevron.left.forwardslash.chevron.right": "code", "paperplane.fill": "send",
} as IconMapping;

export function IconSymbol({ name, size = 24, color, style }: { name: IconSymbolName; size?: number; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight; }) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
