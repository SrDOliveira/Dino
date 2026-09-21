import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";

import { DuoduoMascot } from "@/components/duoduo-mascot";
import { PrimaryButton } from "@/components/primary-button";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { getSubject, LESSONS, Subject } from "@/lib/study-data";
import { useStudy, getRecommendedLesson } from "@/lib/study-store";
import { generateMentorshipPlan } from "@/lib/mentorship-engine";
import { useMemo } from "react";

export default function LevelingResultScreen() {
  const { state, getSubjectScore, getSubjectWeakTopics } = useStudy();
  const subjects: Subject[] = state.selectedSubjectIds.flatMap((subjectId) => {
    const subject = getSubject(subjectId);
    return subject ? [subject] : [];
  });
  const scores = subjects.map((subject) => getSubjectScore(subject.id) ?? 0);
  const nextSubject =
    subjects.find((subject) => getSubjectWeakTopics(subject.id).length)?.shortTitle ??
    subjects[0]?.shortTitle ??
    "sua trilha";
  const recommended = getRecommendedLesson(state.completedLessonIds, state.selectedSubjectIds);
  const plan = useMemo(() => generateMentorshipPlan(state), [state]);
  const weakTopics = subjects.flatMap((s) =>
    getSubjectWeakTopics(s.id).slice(0, 1).map((topic) => ({ subject: s, topic })),
  ).slice(0, 3);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <DuoduoMascot size={88} />
          <Text style={styles.eyebrow}>NIVELAMENTO CONCLUÍDO</Text>
          <Text style={styles.title}>Seu mapa de aprovação começa agora.</Text>
          <Text style={styles.subtitle}>
            Com base nas suas respostas, o Dino montou o foco dos próximos dias para você evoluir com método.
          </Text>
        </View>

        <View style={styles.insight}>
          <MaterialIcons name="auto-graph" size={25} color="#2563EB" />
          <View style={styles.insightText}>
            <Text style={styles.insightTitle}>Primeiro foco tático</Text>
            <Text style={styles.insightBody}>
              Vamos reforçar <Text style={styles.bold}>{nextSubject}</Text> e construir base sólida antes de avançar no edital.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Seu ponto de partida</Text>
        <View style={styles.card}>
          {subjects.map((subject) => {
            const score = getSubjectScore(subject.id) ?? 0;
            return (
              <View key={subject.id} style={styles.scoreRow}>
                <View style={styles.scoreHeader}>
                  <Text style={styles.scoreLabel}>{subject.shortTitle}</Text>
                  <Text style={[styles.scoreValue, { color: subject.color }]}>{score}%</Text>
                </View>
                <ProgressBar value={score} color={subject.color} />
              </View>
            );
          })}
          {!subjects.length && (
            <Text style={styles.empty}>Complete o cadastro com as matérias do seu concurso.</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Sugestão de estudo de hoje</Text>
        <View style={styles.planCard}>
          {plan.goals
            .filter((g) => g.type !== "streak")
            .slice(0, 3)
            .map((goal, index) => (
              <View key={goal.id} style={styles.planRow}>
                <View style={styles.planNum}>
                  <Text style={styles.planNumText}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>{goal.title}</Text>
                  <Text style={styles.planDetail}>
                    {goal.detail}
                    {goal.estimatedMinutes ? ` · ~${goal.estimatedMinutes} min` : ""}
                  </Text>
                </View>
              </View>
            ))}
          {!plan.goals.length && recommended && (
            <View style={styles.planRow}>
              <View style={styles.planNum}>
                <Text style={styles.planNumText}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{recommended.title}</Text>
                <Text style={styles.planDetail}>Primeira missão da sua trilha</Text>
              </View>
            </View>
          )}
        </View>

        {weakTopics.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Temas prioritários</Text>
            <View style={styles.topics}>
              {weakTopics.map(({ subject, topic }) => (
                <Pressable
                  key={`${subject.id}-${topic}`}
                  onPress={() =>
                    router.push({
                      pathname: "/theory" as never,
                      params: { subjectId: subject.id, topic },
                    } as never)
                  }
                  style={styles.topicChip}
                >
                  <MaterialIcons name="menu-book" size={16} color={subject.color} />
                  <Text style={styles.topicText}>
                    {subject.shortTitle}: {topic}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <View style={styles.promise}>
          <MaterialIcons name="military-tech" size={22} color="#B8860B" />
          <Text style={styles.promiseText}>
            Cada dia no Dino avança sua patente e reduz o que falta para a aprovação. Disciplina vence volume solto.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.dock}>
        <PrimaryButton
          label="Começar meu plano de hoje"
          onPress={() => {
            if (recommended) {
              router.replace({ pathname: "/lesson" as never, params: { id: recommended.id } } as never);
            } else {
              router.replace("/(tabs)" as never);
            }
          }}
        />
        <Pressable onPress={() => router.replace("/(tabs)" as never)} style={styles.secondary}>
          <Text style={styles.secondaryText}>Ir para a Arena</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 12, paddingBottom: 20 },
  top: { alignItems: "center" },
  eyebrow: { color: "#2E7F3D", fontSize: 11, fontWeight: "900", letterSpacing: 1, marginTop: 12 },
  title: {
    color: "#102A43",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 32,
  },
  subtitle: {
    color: "#5A7160",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 8,
  },
  insight: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#EAF3FA",
    borderRadius: 18,
    padding: 15,
    marginTop: 20,
  },
  insightText: { flex: 1 },
  insightTitle: { color: "#102A43", fontSize: 14, fontWeight: "900", marginBottom: 3 },
  insightBody: { color: "#466177", fontSize: 13, lineHeight: 18 },
  bold: { fontWeight: "900", color: "#102A43" },
  sectionTitle: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 22,
    marginBottom: 10,
  },
  card: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E1EAE2",
  },
  scoreRow: { marginBottom: 14 },
  scoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  scoreLabel: { color: "#31513A", fontSize: 14, fontWeight: "800" },
  scoreValue: { fontSize: 14, fontWeight: "900" },
  empty: { color: "#667085", fontSize: 13 },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E1EAE2",
    overflow: "hidden",
  },
  planRow: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF3EE",
    alignItems: "center",
  },
  planNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1F8A3A",
    alignItems: "center",
    justifyContent: "center",
  },
  planNumText: { color: "#FFF", fontSize: 13, fontWeight: "900" },
  planTitle: { color: "#162C1B", fontSize: 14, fontWeight: "900" },
  planDetail: { color: "#657169", fontSize: 12, marginTop: 2, fontWeight: "600" },
  topics: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F3FAF1",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#CDE8C8",
  },
  topicText: { color: "#1A4D28", fontSize: 12, fontWeight: "800", maxWidth: 240 },
  promise: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FFF8E8",
    borderRadius: 14,
    padding: 14,
    marginTop: 20,
    alignItems: "flex-start",
  },
  promiseText: { flex: 1, color: "#6B5420", fontSize: 13, lineHeight: 19, fontWeight: "600" },
  dock: { gap: 6, paddingTop: 10, paddingBottom: 4 },
  secondary: { alignItems: "center", paddingVertical: 10 },
  secondaryText: { color: "#5A7160", fontSize: 14, fontWeight: "800" },
});
