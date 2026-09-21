import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { StudySchedule } from "@/lib/study-schedule";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });

export async function syncStudyReminders(schedule: StudySchedule, countdown: string) {
  if (Platform.OS === "web") return { notificationIds: [], available: false };
  await Promise.all(schedule.notificationIds.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)));
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("dino-missoes", { name: "Missões de estudo", importance: Notifications.AndroidImportance.DEFAULT });
  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === "granted" ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted" || !schedule.remindersEnabled) return { notificationIds: [], available: false };
  const notificationIds = await Promise.all(schedule.weekdays.map((weekday) => Notifications.scheduleNotificationAsync({ content: { title: "Missão tática do Dino", body: `Sua missão de hoje está pronta. ${countdown}` }, trigger: { weekday: weekday + 1, hour: schedule.hour, minute: schedule.minute, repeats: true } as Notifications.NotificationTriggerInput })));
  return { notificationIds, available: true };
}
