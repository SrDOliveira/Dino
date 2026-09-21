import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { DuoduoMascot } from "@/components/duoduo-mascot";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { useStudy } from "@/lib/study-store";
import { getSubject } from "@/lib/study-data";
import { getStarterQuestions } from "@/lib/study-store";

export default function LevelingIntroScreen() {
  const { state } = useStudy();
  const subjects = state.selectedSubjectIds.flatMap((id) => {
    const subject = getSubject(id);
    return subject ? [subject.shortTitle] : [];
  });
  const questionCount = getStarterQuestions(state.selectedSubjectIds, state.editorialQuestions).length;
  const half = Math.max(1, Math.ceil(state.selectedSubjectIds.length / 2));

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      <View style={styles.wrap}>
        <DuoduoMascot size={120} />
        <Text style={styles.eyebrow}>NIVELAMENTO RÁPIDO</Text>
        <Text style={styles.title}>Vamos descobrir seu ponto de partida.</Text>
        <Text style={styles.body}>
          São só algumas perguntas curtas — cerca de {questionCount || "6"} questões cobrindo pelo menos{" "}
          {half} matéria{half > 1 ? "s" : ""} do seu concurso. Sem cansaço: o objetivo é montar seu plano
          diário de aprovação.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Matérias no seu radar</Text>
          <Text style={styles.cardBody}>
            {subjects.length ? subjects.join(" · ") : "As matérias do concurso escolhido"}
          </Text>
        </View>

        <View style={styles.bullets}>
          <Text style={styles.bullet}>• Responda com sinceridade (pode marcar “chutei”)</Text>
          <Text style={styles.bullet}>• No fim, você vê o foco e as missões de hoje</Text>
          <Text style={styles.bullet}>• Dá para ajustar a trilha depois, na Arena</Text>
        </View>
      </View>

      <PrimaryButton label="Começar nivelamento" onPress={() => router.replace("/leveling" as never)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", paddingBottom: 12 },
  eyebrow: {
    color: "#2E7F3D",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 16,
    textAlign: "center",
  },
  title: {
    color: "#102A43",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 34,
  },
  body: {
    color: "#5A7160",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 12,
  },
  card: {
    backgroundColor: "#F3FAF1",
    borderRadius: 16,
    padding: 14,
    marginTop: 22,
    borderWidth: 1,
    borderColor: "#CDE8C8",
  },
  cardTitle: { color: "#1A4D28", fontSize: 12, fontWeight: "900", marginBottom: 6 },
  cardBody: { color: "#2A4D30", fontSize: 14, lineHeight: 20, fontWeight: "700" },
  bullets: { marginTop: 18, gap: 8 },
  bullet: { color: "#4A6354", fontSize: 13, lineHeight: 19 },
});
