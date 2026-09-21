import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export const haptic = {
  light: () => Platform.OS !== "web" && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  selection: () => Platform.OS !== "web" && Haptics.selectionAsync(),
  success: () => Platform.OS !== "web" && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  error: () => Platform.OS !== "web" && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
