import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";

import { DuoduoMascot } from "@/components/duoduo-mascot";
import { PrimaryButton } from "@/components/primary-button";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { StudyNavBar } from "@/components/study-nav-bar";
import { Confidence, getQuestion, getSubject, LESSONS } from "@/lib/study-data";
import { useAnswerAudio } from "@/lib/answer-audio";
import { haptic } from "@/lib/haptics";
import { useStudy } from "@/lib/study-store";
import { useSubscription } from "@/lib/subscription-store";

type Stage = "learn" | "practice" | "result";

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const lesson = useMemo(() => LESSONS.find((item) => item.id === id) ?? LESSONS[0], [id]);
  const question = getQuestion(lesson.questionId)!;
  const subject = getSubject(lesson.subjectId)!;
  const { state: studyState, recordAnswer, completeLesson } = useStudy();
  const { playAnswer } = useAnswerAudio(studyState.soundPreference);
  const { remainingSeconds, addStudySeconds, isPro } = useSubscription();

  const [stage, setStage] = useState<Stage>("learn");
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [confidence, setConfidence] = useState<Confidence>("know");

  // Conta tempo de estudo no plano free (1h/dia)
  useEffect(() => {
    if (isPro || stage === "result") return;
    const id = setInterval(() => addStudySeconds(1), 1000);
    return () => clearInterval(id);
  }, [isPro, stage, addStudySeconds]);

  useEffect(() => {
    if (!isPro && remainingSeconds <= 0 && stage !== "result") {
      router.replace({ pathname: "/paywall" as never, params: { reason: "daily_limit" } } as never);
    }
  }, [remainingSeconds, isPro, stage]);

  const correct = choice === question.correctIndex;
  const progressValue = stage === "learn" ? 33 : stage === "practice" && !checked ? 66 : 100;

  const handleCheck = () => {
    if (choice === null) return;
    if (!checked) {
      recordAnswer(question.id, confidence, choice);
      setChecked(true);
      playAnswer(correct);
      if (correct) haptic.success();
      else haptic.error();
      return;
    }
    // Vai para a tela de resultado
    setStage("result");
  };

  const handleFinish = () => {
    completeLesson(lesson);
    router.replace("/(tabs)");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      {/* Header com progresso */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialIcons name="close" size={26} color="#31513A" />
        </Pressable>
        <View style={styles.progress}>
          <ProgressBar value={progressValue} color={subject.color} />
        </View>
        <Text style={styles.steps}>
          {stage === "learn" ? "1/3" : stage === "practice" ? "2/3" : "3/3"}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ===== ETAPA 1: APRENDER ===== */}
        {stage === "learn" && (
          <>
            <View style={styles.mascotRow}>
              <DuoduoMascot size={56} />
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>Atenção total agora. Vamos dominar este tema.</Text>
              </View>
            </View>

            <View style={[styles.subject, { backgroundColor: `${subject.color}18` }]}>
              <View style={[styles.dot, { backgroundColor: subject.color }]} />
              <Text style={[styles.subjectText, { color: subject.color }]}>{subject.shortTitle}</Text>
            </View>

            <Text style={styles.title}>{lesson.title}</Text>
            <Text style={styles.body}>{lesson.body}</Text>

            <View style={[styles.keyPoint, { borderLeftColor: subject.color }]}>
              <MaterialIcons name="lightbulb" size={23} color="#D99100" />
              <View style={styles.keyPointCopy}>
                <Text style={styles.keyPointLabel}>PONTO-CHAVE</Text>
                <Text style={styles.keyPointText}>{lesson.keyPoint}</Text>
              </View>
            </View>

            <View style={styles.example}>
              <Text style={styles.exampleTitle}>Como aplicar em uma questão</Text>
              <Text style={styles.exampleText}>
                Antes de marcar a alternativa, identifique qual regra ou relação de ideias o enunciado está testando.
              </Text>
            </View>
          </>
        )}

        {/* ===== ETAPA 2: PRATICAR ===== */}
        {stage === "practice" && (
          <>
            <View style={styles.mascotRow}>
              <DuoduoMascot size={52} />
              <View style={styles.speechBubble}>
                <Text style={styles.speechText}>
                  {checked
                    ? correct
                      ? "Boa! Você acertou. Leia a explicação."
                      : "Errou, mas faz parte. Entenda o porquê."
                    : "Mostre que entendeu. Escolha com calma."}
                </Text>
              </View>
            </View>

            <Text style={styles.practiceEyebrow}>PRATIQUE AGORA</Text>
            <Text style={styles.practiceTitle}>Mostre que entendeu</Text>
            <Text style={styles.question}>{question.prompt}</Text>

            <View style={styles.options}>
              {question.options.map((option, index) => {
                const selected = choice === index;
                const outcome =
                  checked && (index === question.correctIndex ? "correct" : selected ? "wrong" : "default");
                return (
                  <Pressable
                    key={option}
                    disabled={checked}
                    onPress={() => {
                      setChoice(index);
                      haptic.selection();
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      selected && !checked && styles.optionSelected,
                      outcome === "correct" && styles.optionCorrect,
                      outcome === "wrong" && styles.optionWrong,
                      pressed && !checked && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.letter, selected && styles.letterSelected]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                    <Text
                      style={[
                        styles.optionText,
                        outcome === "correct" && styles.correctText,
                        outcome === "wrong" && styles.wrongText,
                      ]}
                    >
                      {option}
                    </Text>
                    {outcome === "correct" && <MaterialIcons name="check-circle" size={22} color="#238238" />}
                    {outcome === "wrong" && <MaterialIcons name="cancel" size={22} color="#C94A42" />}
                  </Pressable>
                );
              })}
            </View>

            {!checked && (
              <View style={styles.confidence}>
                <Text style={styles.confidenceTitle}>Sua certeza</Text>
                {(
                  [
                    ["know", "Sabia"],
                    ["guess", "Chutei"],
                    ["dont_know", "Não sei"],
                  ] as const
                ).map(([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() => {
                      setConfidence(value);
                      haptic.selection();
                    }}
                    style={[styles.confidenceChoice, confidence === value && styles.confidenceChoiceSelected]}
                  >
                    <Text style={[styles.confidenceText, confidence === value && styles.confidenceTextSelected]}>
                      {label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {checked && (
              <View style={[styles.feedback, correct ? styles.feedbackGood : styles.feedbackReview]}>
                <MaterialIcons
                  name={correct ? "check-circle" : "tips-and-updates"}
                  size={23}
                  color={correct ? "#238238" : "#B77B00"}
                />
                <Text style={styles.feedbackText}>{question.explanation}</Text>
              </View>
            )}
          </>
        )}

        {/* ===== ETAPA 3: RESULTADO ===== */}
        {stage === "result" && (
          <View style={styles.resultWrap}>
            <DuoduoMascot size={88} />
            <Text style={styles.resultEmoji}>{correct ? "🎯" : "💪"}</Text>
            <Text style={styles.resultTitle}>{correct ? "Missão cumprida!" : "Aprendizado registrado"}</Text>
            <Text style={styles.resultBody}>
              {correct
                ? "Você dominou este ponto. Continue avançando no mapa tático."
                : "Errar faz parte do treino. O Dino já registrou este tema como prioritário para revisão."}
            </Text>

            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Tema</Text>
                <Text style={styles.resultValue}>{lesson.topic}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Resultado</Text>
                <Text style={[styles.resultValue, { color: correct ? "#1F7A32" : "#B45A00" }]}>
                  {correct ? "Acerto" : "Revisão necessária"}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Certeza</Text>
                <Text style={styles.resultValue}>
                  {confidence === "know" ? "Sabia" : confidence === "guess" ? "Chutei" : "Não sei"}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Dock de ação */}
      <View style={styles.actionDock}>
        {stage === "learn" && (
          <PrimaryButton label="Ir para a questão" onPress={() => setStage("practice")} />
        )}
        {stage === "practice" && (
          <PrimaryButton
            label={checked ? "Ver resultado" : "Conferir resposta"}
            disabled={choice === null}
            onPress={handleCheck}
          />
        )}
        {stage === "result" && (
          <PrimaryButton label="Continuar no mapa" onPress={handleFinish} />
        )}
        <StudyNavBar />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 13, paddingTop: 8 },
  progress: { flex: 1 },
  steps: { color: "#667085", fontSize: 12, fontWeight: "800" },
  scroll: { flex: 1 },
  content: { paddingTop: 20, paddingBottom: 24 },
  actionDock: { gap: 9, paddingTop: 10, paddingBottom: 2, backgroundColor: "#FFFFFF" },

  mascotRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  speechBubble: {
    flex: 1,
    backgroundColor: "#E8F6E4",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#C5E6BC",
  },
  speechText: { color: "#1A4D28", fontSize: 14, fontWeight: "700", lineHeight: 20 },

  subject: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  dot: { width: 8, height: 8, borderRadius: 5 },
  subjectText: { fontSize: 12, fontWeight: "900" },
  title: {
    color: "#102A43",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    fontWeight: "900",
    marginTop: 16,
  },
  body: { color: "#405A4A", fontSize: 17, lineHeight: 27, marginTop: 14 },
  keyPoint: {
    flexDirection: "row",
    gap: 10,
    borderLeftWidth: 4,
    backgroundColor: "#FFF9E7",
    borderRadius: 14,
    padding: 14,
    marginTop: 22,
  },
  keyPointCopy: { flex: 1 },
  keyPointLabel: { color: "#9A6A00", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  keyPointText: { color: "#634A00", fontSize: 14, lineHeight: 20, fontWeight: "700", marginTop: 3 },
  example: { backgroundColor: "#F0F5F0", padding: 15, borderRadius: 16, marginTop: 14 },
  exampleTitle: { color: "#31513A", fontSize: 14, fontWeight: "900" },
  exampleText: { color: "#587062", fontSize: 13, lineHeight: 19, marginTop: 5 },

  practiceEyebrow: { color: "#39B54A", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  practiceTitle: { color: "#102A43", fontSize: 26, fontWeight: "900", letterSpacing: -0.5, marginTop: 6 },
  question: { color: "#243B53", fontSize: 17, lineHeight: 26, fontWeight: "600", marginTop: 16 },
  options: { gap: 10, marginTop: 18 },
  option: {
    minHeight: 60,
    flexDirection: "row",
    gap: 11,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#DFE9E0",
    borderRadius: 16,
  },
  optionSelected: { borderColor: "#54B664", backgroundColor: "#F2FBF0" },
  optionCorrect: { borderColor: "#31A75B", backgroundColor: "#EAF8EE" },
  optionWrong: { borderColor: "#E2776E", backgroundColor: "#FFF1EF" },
  letter: {
    width: 27,
    height: 27,
    lineHeight: 27,
    textAlign: "center",
    borderRadius: 14,
    backgroundColor: "#EEF3EF",
    color: "#667085",
    fontSize: 12,
    fontWeight: "900",
  },
  letterSelected: { backgroundColor: "#DDF5D4", color: "#1F7A32" },
  optionText: { flex: 1, color: "#243B53", fontSize: 14, lineHeight: 19, fontWeight: "600" },
  correctText: { color: "#18753C" },
  wrongText: { color: "#B83C35" },

  confidence: { flexDirection: "row", gap: 7, marginTop: 17, alignItems: "center" },
  confidenceTitle: { color: "#667085", fontSize: 12, fontWeight: "800", marginRight: 2 },
  confidenceChoice: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFE9E0",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  confidenceChoiceSelected: { backgroundColor: "#E7F8E3", borderColor: "#76CD83" },
  confidenceText: { color: "#667085", fontSize: 11, fontWeight: "800" },
  confidenceTextSelected: { color: "#1F7A32" },

  feedback: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 16, marginTop: 18 },
  feedbackGood: { backgroundColor: "#EAF8EE" },
  feedbackReview: { backgroundColor: "#FFF6E4" },
  feedbackText: { flex: 1, color: "#405A4A", fontSize: 13, lineHeight: 19 },

  resultWrap: { alignItems: "center", paddingTop: 24 },
  resultEmoji: { fontSize: 42, marginTop: 8 },
  resultTitle: {
    color: "#102A43",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 10,
    textAlign: "center",
  },
  resultBody: {
    color: "#4A6354",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 12,
  },
  resultCard: {
    width: "100%",
    backgroundColor: "#F4F8F3",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: "#D8E6D6",
  },
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultLabel: { color: "#667085", fontSize: 13, fontWeight: "700" },
  resultValue: { color: "#1A2E22", fontSize: 14, fontWeight: "800" },

  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
});
