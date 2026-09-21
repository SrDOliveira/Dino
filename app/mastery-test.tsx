import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { StudyNavBar } from "@/components/study-nav-bar";
import { QUESTIONS, getSubject } from "@/lib/study-data";
import { useStudy } from "@/lib/study-store";

const REQUIRED_SCORE = 75;

export default function MasteryTestScreen() {
  const { subjectId, topic } = useLocalSearchParams<{ subjectId?: string; topic?: string }>();
  const { recordAnswer, setTopicMastery } = useStudy();
  const subject = getSubject(subjectId ?? "portugues") ?? getSubject("portugues")!;
  const targetTopic = topic ?? subject.topics[0];
  const questions = useMemo(() => {
    const topicQuestions = QUESTIONS.filter((question) => question.subjectId === subject.id && question.topic === targetTopic);
    return (topicQuestions.length ? topicQuestions : QUESTIONS.filter((question) => question.subjectId === subject.id)).slice(0, 4);
  }, [subject.id, targetTopic]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = questions[index];
  const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;

  const continueTest = () => {
    if (choice === null || !question) return;
    const correct = choice === question.correctIndex;
    recordAnswer(question.id, "know", choice);
    const nextCorrect = correctCount + Number(correct);
    if (index >= questions.length - 1) {
      const finalScore = Math.round((nextCorrect / questions.length) * 100);
      setCorrectCount(nextCorrect);
      setTopicMastery(subject.id, targetTopic, { score: finalScore, verifiedAt: new Date().toISOString(), status: finalScore >= REQUIRED_SCORE ? "verified" : "needs_review" });
      setFinished(true);
    } else { setCorrectCount(nextCorrect); setChoice(null); setIndex((current) => current + 1); }
  };

  if (!questions.length) return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5"><View style={styles.center}><Text style={styles.title}>Conteúdo em preparação</Text><Text style={styles.text}>Ainda não há questões suficientes para validar este tópico.</Text></View><StudyNavBar /></ScreenContainer>;
  if (finished) return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5"><View style={styles.center}><View style={[styles.icon, score >= REQUIRED_SCORE ? styles.iconGood : styles.iconReview]}><MaterialIcons name={score >= REQUIRED_SCORE ? "verified" : "refresh"} size={37} color={score >= REQUIRED_SCORE ? "#1F7A32" : "#9A6A00"} /></View><Text style={styles.eyebrow}>TESTE DE DOMÍNIO</Text><Text style={styles.title}>{score >= REQUIRED_SCORE ? "Tema comprovado" : "Vamos revisar este tema"}</Text><Text style={styles.score}>{score}%</Text><Text style={styles.text}>{score >= REQUIRED_SCORE ? `Você atingiu a meta de ${REQUIRED_SCORE}% e o tema entrará como concluído no mapa.` : `A meta é ${REQUIRED_SCORE}%. O Dino manterá este tema na sua rota de revisão.`}</Text><PrimaryButton label="Voltar para Trilhas" onPress={() => router.replace("/(tabs)/trail" as never)} /></View><StudyNavBar /></ScreenContainer>;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5"><View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={10}><MaterialIcons name="close" size={25} color="#31513A" /></Pressable><View><Text style={styles.headerTitle}>Teste de domínio</Text><Text style={styles.headerMeta}>{index + 1} de {questions.length} · meta {REQUIRED_SCORE}%</Text></View></View><ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Text style={styles.subject}>{subject.shortTitle.toUpperCase()}</Text><Text style={styles.topic}>{targetTopic}</Text><Text style={styles.question}>{question.prompt}</Text><View style={styles.options}>{question.options.map((option, optionIndex) => <Pressable key={option} onPress={() => setChoice(optionIndex)} style={[styles.option, choice === optionIndex && styles.optionSelected]}><Text style={[styles.letter, choice === optionIndex && styles.letterSelected]}>{String.fromCharCode(65 + optionIndex)}</Text><Text style={styles.optionText}>{option}</Text></Pressable>)}</View></ScrollView><View style={styles.dock}><PrimaryButton label={index === questions.length - 1 ? "Ver resultado" : "Próxima questão"} disabled={choice === null} onPress={continueTest} /><StudyNavBar /></View></ScreenContainer>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 8 }, headerTitle: { color: "#193721", fontSize: 17, fontWeight: "900" }, headerMeta: { color: "#6D7B72", fontSize: 10, fontWeight: "800", marginTop: 2 }, scroll: { flex: 1 }, content: { paddingTop: 29, paddingBottom: 20 }, subject: { color: "#207D37", fontSize: 11, fontWeight: "900", letterSpacing: 1 }, topic: { color: "#102A43", fontSize: 24, fontWeight: "900", marginTop: 5 }, question: { color: "#263C2D", fontSize: 18, lineHeight: 27, fontWeight: "700", marginTop: 20 }, options: { gap: 10, marginTop: 22 }, option: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 11, padding: 13, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#DCE8DE", borderRadius: 16 }, optionSelected: { backgroundColor: "#EDF9E8", borderColor: "#49A85B" }, letter: { width: 28, height: 28, borderRadius: 14, textAlign: "center", lineHeight: 28, backgroundColor: "#EEF3EF", color: "#667085", fontSize: 13, fontWeight: "900" }, letterSelected: { color: "#FFFFFF", backgroundColor: "#2E9745" }, optionText: { flex: 1, color: "#263C2D", fontSize: 14, lineHeight: 20, fontWeight: "600" }, dock: { gap: 9, paddingTop: 10, paddingBottom: 2, backgroundColor: "#FFFFFF" }, center: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 14 }, icon: { width: 78, height: 78, borderRadius: 39, alignItems: "center", justifyContent: "center" }, iconGood: { backgroundColor: "#E4F6DF" }, iconReview: { backgroundColor: "#FFF3D7" }, eyebrow: { color: "#52735A", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 19 }, title: { color: "#173820", fontSize: 25, fontWeight: "900", textAlign: "center", marginTop: 8 }, score: { color: "#1D8438", fontSize: 47, fontWeight: "900", marginTop: 15 }, text: { color: "#627168", textAlign: "center", fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 21, maxWidth: 280 },
});
