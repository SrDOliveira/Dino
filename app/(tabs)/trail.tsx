import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";

import { DuoduoMascot } from "@/components/duoduo-mascot";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { getSubject, LESSONS, Subject } from "@/lib/study-data";
import { haptic } from "@/lib/haptics";
import { useStudy } from "@/lib/study-store";

export default function TrailScreen() {
  const { state, setWeeklyPriorities } = useStudy();
  const subjects: Subject[] = state.selectedSubjectIds.flatMap((id) => {
    const subject = getSubject(id);
    return subject ? [subject] : [];
  });

  const totalLessons = LESSONS.filter((l) => state.selectedSubjectIds.includes(l.subjectId)).length;
  const completedLessons = LESSONS.filter(
    (l) => state.selectedSubjectIds.includes(l.subjectId) && state.completedLessonIds.includes(l.id),
  ).length;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const togglePriority = (lessonId: string) => {
    haptic.selection();
    const current = state.weeklyPriorityLessonIds;
    setWeeklyPriorities(
      current.includes(lessonId)
        ? current.filter((id) => id !== lessonId)
        : [...current, lessonId].slice(0, 3),
    );
  };

  return (
    <ScreenContainer className="px-5">
      <FlatList
        data={subjects}
        keyExtractor={(subject) => subject.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Sua trilha</Text>
                <Text style={styles.subtitle}>
                  Escolha até 3 prioridades da semana. O mapa e a mentoria usam isso para te guiar.
                </Text>
              </View>
              <DuoduoMascot size={52} />
            </View>

            <View style={styles.progressCard}>
              <View style={styles.progressTop}>
                <Text style={styles.progressLabel}>PROGRESSO GERAL DA TRILHA</Text>
                <Text style={styles.progressValue}>{overallProgress}%</Text>
              </View>
              <ProgressBar value={overallProgress} color="#1F8A3A" />
              <Text style={styles.progressMeta}>
                {completedLessons} de {totalLessons} lições concluídas
              </Text>
            </View>

            <Pressable
              onPress={() => router.push("/study-schedule" as never)}
              style={({ pressed }) => [styles.scheduleCard, pressed && styles.pressed]}
            >
              <MaterialIcons name="notifications-active" size={22} color="#2C743B" />
              <View style={styles.scheduleCopy}>
                <Text style={styles.scheduleTitle}>Planejar meus estudos</Text>
                <Text style={styles.scheduleText}>Dias, horário e contagem até a prova</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#678270" />
            </Pressable>

            <View style={styles.priorityNotice}>
              <MaterialIcons name="flag" size={18} color="#1F7A32" />
              <Text style={styles.priorityText}>
                {state.weeklyPriorityLessonIds.length
                  ? `${state.weeklyPriorityLessonIds.length}/3 prioridades da semana`
                  : "Toque na bandeira para priorizar até 3 lições"}
              </Text>
            </View>
          </>
        }
        renderItem={({ item: subject }) => {
          const subjectLessons = LESSONS.filter((lesson) => lesson.subjectId === subject.id);
          const completed = subjectLessons.filter((lesson) =>
            state.completedLessonIds.includes(lesson.id),
          ).length;
          const percent = subjectLessons.length
            ? Math.round((completed / subjectLessons.length) * 100)
            : 0;

          return (
            <View style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <View style={[styles.subjectDot, { backgroundColor: subject.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.subjectTitle}>{subject.shortTitle}</Text>
                  <Text style={styles.subjectMeta}>
                    {completed}/{subjectLessons.length} lições · {percent}%
                  </Text>
                </View>
              </View>
              <ProgressBar value={percent} color={subject.color} />

              <View style={styles.lessonList}>
                {subjectLessons.map((lesson, index) => {
                  const done = state.completedLessonIds.includes(lesson.id);
                  const isPriority = state.weeklyPriorityLessonIds.includes(lesson.id);
                  const isNext =
                    !done &&
                    subjectLessons.findIndex((l) => !state.completedLessonIds.includes(l.id)) === index;

                  return (
                    <View key={lesson.id} style={styles.lessonRow}>
                      <Pressable
                        onPress={() => {
                          haptic.light();
                          router.push({ pathname: "/lesson" as never, params: { id: lesson.id } } as never);
                        }}
                        style={({ pressed }) => [styles.lessonMain, pressed && styles.pressed]}
                      >
                        <View
                          style={[
                            styles.step,
                            done && styles.stepDone,
                            isNext && styles.stepNext,
                          ]}
                        >
                          {done ? (
                            <MaterialIcons name="check" size={16} color="#FFFFFF" />
                          ) : (
                            <Text style={[styles.stepText, isNext && styles.stepTextNext]}>
                              {index + 1}
                            </Text>
                          )}
                        </View>
                        <View style={styles.lessonCopy}>
                          <Text style={styles.lessonTitle} numberOfLines={2}>
                            {lesson.title}
                          </Text>
                          <Text style={styles.lessonInfo}>
                            {lesson.topic} · {lesson.durationMinutes} min
                            {isNext ? " · próxima" : done ? " · concluída" : ""}
                          </Text>
                        </View>
                      </Pressable>

                      <View style={styles.lessonActions}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: "/theory" as never,
                              params: { subjectId: lesson.subjectId, topic: lesson.topic },
                            } as never)
                          }
                          style={styles.iconBtn}
                          hitSlop={6}
                        >
                          <MaterialIcons name="menu-book" size={18} color="#2B7139" />
                        </Pressable>
                        <Pressable
                          onPress={() => togglePriority(lesson.id)}
                          style={[styles.iconBtn, isPriority && styles.iconBtnPriority]}
                          hitSlop={6}
                        >
                          <MaterialIcons
                            name={isPriority ? "flag" : "outlined-flag"}
                            size={18}
                            color={isPriority ? "#B8860B" : "#6B7F70"}
                          />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Complete o onboarding e selecione disciplinas para montar sua trilha.
            </Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 10, paddingBottom: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  title: { color: "#102A43", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: "#5A7160", fontSize: 14, lineHeight: 20, marginTop: 4 },

  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D8E4D6",
    marginBottom: 12,
  },
  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: { color: "#2A4D30", fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
  progressValue: { color: "#1F8A3A", fontSize: 18, fontWeight: "900" },
  progressMeta: { color: "#6B7F70", fontSize: 12, fontWeight: "700", marginTop: 8 },

  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#EAF6E8",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#C5E6BC",
  },
  scheduleCopy: { flex: 1 },
  scheduleTitle: { color: "#1A4D28", fontSize: 14, fontWeight: "900" },
  scheduleText: { color: "#4A6B52", fontSize: 12, marginTop: 2 },

  priorityNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F3FAF1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  priorityText: { flex: 1, color: "#1F5E32", fontSize: 13, fontWeight: "700" },

  subjectCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E1EAE2",
  },
  subjectHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  subjectDot: { width: 12, height: 12, borderRadius: 6 },
  subjectTitle: { color: "#102A43", fontSize: 17, fontWeight: "900" },
  subjectMeta: { color: "#6B7F70", fontSize: 12, fontWeight: "700", marginTop: 2 },

  lessonList: { marginTop: 12, gap: 4 },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEF3EE",
    paddingTop: 10,
    marginTop: 6,
  },
  lessonMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  step: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF3EF",
    borderWidth: 1.5,
    borderColor: "#D0DCD2",
  },
  stepDone: { backgroundColor: "#39B54A", borderColor: "#39B54A" },
  stepNext: { backgroundColor: "#1F8A3A", borderColor: "#CEFF88", borderWidth: 2 },
  stepText: { fontSize: 12, fontWeight: "900", color: "#5A7160" },
  stepTextNext: { color: "#FFFFFF" },
  lessonCopy: { flex: 1 },
  lessonTitle: { color: "#243B53", fontSize: 14, lineHeight: 19, fontWeight: "800" },
  lessonInfo: { color: "#7A8B7E", fontSize: 12, marginTop: 2 },

  lessonActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F1",
  },
  iconBtnPriority: { backgroundColor: "#FFF1C7" },

  empty: { padding: 24, alignItems: "center" },
  emptyText: { color: "#667085", fontSize: 14, textAlign: "center", lineHeight: 20 },
  pressed: { opacity: 0.75 },
});
