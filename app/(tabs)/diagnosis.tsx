import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";

import { DuoduoMascot } from "@/components/duoduo-mascot";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { priorityLabel, summarizeConfidence } from "@/lib/study-rules";
import { getSubject, Subject, LESSONS } from "@/lib/study-data";
import { useStudy } from "@/lib/study-store";

export default function DiagnosisScreen() {
  const { state, getSubjectScore, getSubjectWeakTopics } = useStudy();
  const subjects: Subject[] = state.selectedSubjectIds.flatMap((id) => {
    const subject = getSubject(id);
    return subject ? [subject] : [];
  });
  const answered = state.answers.length;
  const weakSubjects = subjects
    .map((subject) => ({ subject, score: getSubjectScore(subject.id) ?? 0 }))
    .sort((a, b) => a.score - b.score);
  const focus = weakSubjects[0]?.subject;
  const summary = summarizeConfidence(state.answers);

  const reviewTopics = subjects
    .flatMap((subject) =>
      getSubjectWeakTopics(subject.id).map((topic) => {
        const answers = state.answers.filter(
          (answer) => answer.subjectId === subject.id && answer.topic === topic,
        );
        const signalWeight = answers.filter(
          (answer) => !answer.correct || answer.confidence !== "know",
        ).length;
        const relatedLesson = LESSONS.find(
          (l) => l.subjectId === subject.id && l.topic === topic,
        );
        return {
          topic,
          subject,
          answers,
          signalWeight,
          recommendation: answers.length
            ? priorityLabel(answers)
            : "Inclua esse tema na sua base",
          relatedLessonId: relatedLesson?.id,
        };
      }),
    )
    .sort((a, b) => b.signalWeight - a.signalWeight)
    .slice(0, 6);

  return (
    <ScreenContainer className="px-5">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Diagnóstico</Text>
            <Text style={styles.subtitle}>
              {answered
                ? "Seu mapa de aprendizagem atualiza a cada resposta."
                : "Responda a algumas questões para montar seu diagnóstico."}
            </Text>
          </View>
          <DuoduoMascot size={48} />
        </View>

        {focus && (
          <View style={styles.focusCard}>
            <View style={styles.focusIcon}>
              <MaterialIcons name="psychology" size={26} color="#2563EB" />
            </View>
            <View style={styles.focusCopy}>
              <Text style={styles.focusEyebrow}>FOCO RECOMENDADO AGORA</Text>
              <Text style={styles.focusTitle}>{focus.shortTitle}</Text>
              <Text style={styles.focusBody}>
                {getSubjectWeakTopics(focus.id).slice(0, 2).join(" · ") ||
                  "Continue avançando pela trilha tática."}
              </Text>
            </View>
          </View>
        )}

        {answered > 0 && (
          <>
            <Text style={styles.sectionTitle}>Sinais do seu desempenho</Text>
            <View style={styles.signalCard}>
              <Signal
                icon="help-outline"
                color="#C77B00"
                label="Errou com dúvida"
                value={summary.unsureWrong}
                description="Volte ao conceito-base do tema."
              />
              <Signal
                icon="warning-amber"
                color="#C64941"
                label="Errou com confiança"
                value={summary.certainWrong}
                description="Há confusão conceitual a corrigir."
              />
              <Signal
                icon="casino"
                color="#3676AB"
                label="Acertou no chute"
                value={summary.guessedCorrect}
                description="Consolide para não depender da sorte."
              />
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Domínio por disciplina</Text>
        <View style={styles.scoreCard}>
          {subjects.map((subject) => {
            const score = getSubjectScore(subject.id);
            const label =
              score === null
                ? "Aguardando dados"
                : score >= 75
                  ? "Boa base"
                  : score >= 45
                    ? "Em construção"
                    : "Prioridade";
            return (
              <View key={subject.id} style={styles.scoreRow}>
                <View style={styles.scoreTop}>
                  <View style={styles.scoreName}>
                    <View style={[styles.dot, { backgroundColor: subject.color }]} />
                    <Text style={styles.scoreLabel}>{subject.shortTitle}</Text>
                  </View>
                  <Text style={[styles.scoreStatus, { color: subject.color }]}>
                    {score === null ? label : `${score}% · ${label}`}
                  </Text>
                </View>
                <ProgressBar value={score ?? 0} color={subject.color} />
              </View>
            );
          })}
          {subjects.length === 0 && (
            <Text style={styles.emptyText}>
              Selecione disciplinas no onboarding para ver o domínio aqui.
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Temas prioritários para estudar</Text>
        <View style={styles.reviewCard}>
          {reviewTopics.length > 0 ? (
            reviewTopics.map(({ topic, subject, recommendation, relatedLessonId }) => (
              <Pressable
                key={`${subject.id}-${topic}`}
                onPress={() => {
                  if (relatedLessonId) {
                    router.push({
                      pathname: "/lesson" as never,
                      params: { id: relatedLessonId },
                    } as never);
                  } else {
                    router.push({
                      pathname: "/theory" as never,
                      params: { subjectId: subject.id, topic },
                    } as never);
                  }
                }}
                style={({ pressed }) => [styles.reviewRow, pressed && styles.reviewPressed]}
              >
                <View style={[styles.reviewBadge, { backgroundColor: `${subject.color}22` }]}>
                  <MaterialIcons name="menu-book" size={18} color={subject.color} />
                </View>
                <View style={styles.reviewCopy}>
                  <Text style={styles.reviewTopic} numberOfLines={1}>
                    {topic}
                  </Text>
                  <Text style={styles.reviewSubject} numberOfLines={1}>
                    {subject.shortTitle} · {recommendation}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#809087" />
              </Pressable>
            ))
          ) : (
            <View style={styles.noReview}>
              <Text style={styles.noReviewText}>
                {answered === 0
                  ? "Responda questões nas lições para o Dino montar seus temas prioritários."
                  : "Nenhum tema crítico no momento. Continue avançando no mapa tático."}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.note}>
          <MaterialIcons name="info-outline" size={18} color="#587062" />
          <Text style={styles.noteText}>
            O diagnóstico usa apenas o seu histórico de respostas neste aparelho. Quanto mais você
            pratica, mais preciso fica o direcionamento.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Signal({
  icon,
  color,
  label,
  value,
  description,
}: {
  icon: "help-outline" | "warning-amber" | "casino";
  color: string;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <View style={styles.signalRow}>
      <View style={[styles.signalIcon, { backgroundColor: `${color}18` }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <View style={styles.signalCopy}>
        <Text style={styles.signalLabel}>{label}</Text>
        <Text style={styles.signalDescription}>{description}</Text>
      </View>
      <Text style={[styles.signalValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 12, paddingBottom: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  title: { color: "#102A43", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: "#5A7160", fontSize: 14, lineHeight: 20, marginTop: 4 },

  focusCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#EAF2FC",
    borderRadius: 18,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#C5D9F0",
  },
  focusIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "#D6E8F7",
    alignItems: "center",
    justifyContent: "center",
  },
  focusCopy: { flex: 1 },
  focusEyebrow: { color: "#3676AB", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  focusTitle: { color: "#102A43", fontSize: 17, fontWeight: "900", marginTop: 2 },
  focusBody: { color: "#466177", fontSize: 13, lineHeight: 18, marginTop: 3 },

  sectionTitle: { color: "#102A43", fontSize: 17, fontWeight: "900", marginTop: 24, marginBottom: 11 },

  signalCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1EAE2",
    overflow: "hidden",
  },
  signalRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E9EEEA",
  },
  signalIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  signalCopy: { flex: 1 },
  signalLabel: { color: "#243B53", fontSize: 13, fontWeight: "900" },
  signalDescription: { color: "#7A8B7E", fontSize: 11, marginTop: 2 },
  signalValue: { fontSize: 21, fontWeight: "900" },

  scoreCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E1EAE2",
  },
  scoreRow: { marginBottom: 16 },
  scoreTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  scoreName: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  scoreLabel: { color: "#31513A", fontSize: 14, fontWeight: "800" },
  scoreStatus: { fontSize: 12, fontWeight: "800" },
  emptyText: { color: "#667085", fontSize: 13, lineHeight: 19 },

  reviewCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1EAE2",
    overflow: "hidden",
  },
  reviewRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 14,
    borderBottomColor: "#E9EEEA",
    borderBottomWidth: 1,
  },
  reviewPressed: { opacity: 0.7, backgroundColor: "#F2FAF0" },
  reviewBadge: {
    width: 33,
    height: 33,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewCopy: { flex: 1 },
  reviewTopic: { color: "#243B53", fontSize: 14, fontWeight: "800" },
  reviewSubject: { color: "#7A8B7E", fontSize: 11, lineHeight: 16, marginTop: 2 },
  noReview: { padding: 16 },
  noReviewText: { color: "#667085", fontSize: 13, lineHeight: 19 },

  note: {
    marginTop: 17,
    padding: 13,
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F0F5F0",
    borderRadius: 14,
  },
  noteText: { flex: 1, color: "#587062", fontSize: 12, lineHeight: 17 },
});
