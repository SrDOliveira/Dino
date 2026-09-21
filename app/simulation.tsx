import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";

import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import { StudyNavBar } from "@/components/study-nav-bar";
import { getLocalPoliceContest } from "@/lib/contest-catalog";
import { getRankForPoints } from "@/lib/tactical-system";
import { simulationMessage, simulationResult } from "@/lib/simulation-rules";
import { QUESTIONS } from "@/lib/study-data";
import { useStudy } from "@/lib/study-store";
import { useSubscription } from "@/lib/subscription-store";

export default function SimulationScreen() {
  const { state, recordAnswer, addSimulation } = useStudy();
  const { isPro } = useSubscription();
  const contest = getLocalPoliceContest(state.contestId);

  useEffect(() => {
    if (isPro) return;
    const today = new Date().toISOString().slice(0, 10);
    const simsToday = state.simulations.filter((s) => s.completedAt.slice(0, 10) === today).length;
    if (simsToday >= 1) {
      router.replace({ pathname: "/paywall" as never, params: { reason: "simulation_limit" } } as never);
    }
  }, [isPro, state.simulations]);

  const questions = useMemo(() => QUESTIONS.filter((question) => state.selectedSubjectIds.includes(question.subjectId)).slice(0, 10), [state.selectedSubjectIds]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ correct: boolean }[]>([]);
  const [finished, setFinished] = useState(false);
  const question = questions[index];
  const result = simulationResult({ answers });

  const next = () => {
    if (!question || choice === null) return;
    const correct = choice === question.correctIndex;
    recordAnswer(question.id, "know", choice);
    const nextAnswers = [...answers, { correct }];
    if (index >= questions.length - 1) {
      const finalResult = simulationResult({ answers: nextAnswers });
      addSimulation({ id: `sim-${Date.now()}`, completedAt: new Date().toISOString(), correct: finalResult.correct, total: finalResult.total, accuracy: finalResult.accuracy, cutoff: finalResult.cutoff });
      setAnswers(nextAnswers);
      setFinished(true);
    } else {
      setAnswers(nextAnswers);
      setChoice(null);
      setIndex((current) => current + 1);
    }
  };

  const share = async () => {
    const rank = getRankForPoints(state.tacticalPoints);
    await Share.share({ message: simulationMessage({ contestTitle: contest.title, correct: result.correct, total: result.total, accuracy: result.accuracy, rankTitle: rank.title }) });
  };

  if (!questions.length) return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5"><View style={styles.empty}><MaterialIcons name="quiz" size={42} color="#4A8456" /><Text style={styles.emptyTitle}>Configure seu concurso</Text><Text style={styles.emptyText}>Escolha as disciplinas do seu concurso antes de iniciar um simulado.</Text><PrimaryButton label="Ir para a Arena" onPress={() => router.replace("/(tabs)" as never)} /></View><StudyNavBar /></ScreenContainer>;

  if (finished) return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5"><View style={styles.resultWrap}><View style={[styles.resultIcon, result.approved ? styles.resultGood : styles.resultReview]}><MaterialIcons name={result.approved ? "emoji-events" : "auto-graph"} size={41} color={result.approved ? "#1D7C35" : "#A36A00"} /></View><Text style={styles.resultEyebrow}>SIMULADO TÁTICO CONCLUÍDO</Text><Text style={styles.resultTitle}>{result.approved ? "Você passou do corte estimado" : "Seu diagnóstico ficou pronto"}</Text><Text style={styles.score}>{result.correct}<Text style={styles.scoreTotal}>/{result.total}</Text></Text><Text style={styles.scoreLabel}>acertos · {result.accuracy}%</Text><View style={styles.cutoff}><MaterialIcons name="flag" size={19} color="#2A7138" /><Text style={styles.cutoffText}>Corte estimado: {result.cutoff}%</Text></View><Text style={styles.resultText}>{result.approved ? "Mantenha a revisão espaçada para transformar este resultado em constância." : "Revise os pontos críticos no Diagnóstico e retorne para um novo simulado."}</Text><View style={styles.resultActions}><PrimaryButton label="Compartilhar resultado" onPress={share} /><Pressable onPress={() => router.replace("/(tabs)/diagnosis" as never)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Ver diagnóstico</Text></Pressable></View></View><StudyNavBar /></ScreenContainer>;

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5"><View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={10}><MaterialIcons name="close" size={26} color="#31513A" /></Pressable><View style={styles.headerCopy}><Text style={styles.headerTitle}>Simulado tático</Text><Text style={styles.headerMeta}>{index + 1} de {questions.length} · corte estimado 70%</Text></View><MaterialIcons name="timer" size={23} color="#B67A00" /></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((index + 1) / questions.length) * 100}%` }]} /></View><ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Text style={styles.subject}>{question.subjectId.toUpperCase()}</Text><Text style={styles.question}>{question.prompt}</Text><View style={styles.options}>{question.options.map((option, optionIndex) => <Pressable key={option} onPress={() => setChoice(optionIndex)} style={[styles.option, choice === optionIndex && styles.optionSelected]}><Text style={[styles.optionLetter, choice === optionIndex && styles.optionLetterSelected]}>{String.fromCharCode(65 + optionIndex)}</Text><Text style={styles.optionText}>{option}</Text></Pressable>)}</View></ScrollView><View style={styles.actionDock}><PrimaryButton label={index === questions.length - 1 ? "Finalizar simulado" : "Próxima questão"} disabled={choice === null} onPress={next} /><StudyNavBar /></View></ScreenContainer>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 8 }, headerCopy: { flex: 1 }, headerTitle: { color: "#173820", fontSize: 17, fontWeight: "900" }, headerMeta: { color: "#687B6E", fontSize: 10, fontWeight: "800", marginTop: 2 }, progressTrack: { height: 7, borderRadius: 4, backgroundColor: "#DFE9E0", marginTop: 13, overflow: "hidden" }, progressFill: { height: "100%", backgroundColor: "#2E9745", borderRadius: 4 }, scroll: { flex: 1 }, content: { paddingTop: 28, paddingBottom: 20 }, subject: { color: "#1F7A32", fontSize: 11, fontWeight: "900", letterSpacing: 1 }, question: { color: "#102A43", fontSize: 20, lineHeight: 29, fontWeight: "800", marginTop: 12 }, options: { gap: 10, marginTop: 25 }, option: { flexDirection: "row", alignItems: "center", minHeight: 64, gap: 11, padding: 13, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#DCE8DE" }, optionSelected: { backgroundColor: "#EDF9E8", borderColor: "#49A85B" }, optionLetter: { width: 28, height: 28, borderRadius: 14, textAlign: "center", lineHeight: 28, color: "#5D7563", backgroundColor: "#EEF3EF", fontSize: 13, fontWeight: "900" }, optionLetterSelected: { color: "#FFFFFF", backgroundColor: "#2E9745" }, optionText: { flex: 1, color: "#263C2D", fontSize: 14, lineHeight: 20, fontWeight: "600" }, actionDock: { gap: 9, paddingTop: 10, paddingBottom: 2, backgroundColor: "#FFFFFF" }, resultWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 12 }, resultIcon: { width: 82, height: 82, borderRadius: 41, alignItems: "center", justifyContent: "center" }, resultGood: { backgroundColor: "#E4F6DF" }, resultReview: { backgroundColor: "#FFF4D6" }, resultEyebrow: { color: "#487353", fontSize: 10, fontWeight: "900", letterSpacing: 1, marginTop: 19 }, resultTitle: { color: "#173820", textAlign: "center", fontSize: 25, lineHeight: 30, fontWeight: "900", marginTop: 8 }, score: { color: "#1E8839", fontSize: 52, fontWeight: "900", marginTop: 18 }, scoreTotal: { color: "#84A78C", fontSize: 25 }, scoreLabel: { color: "#5F7064", fontSize: 13, fontWeight: "800" }, cutoff: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EAF6E6", paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, marginTop: 14 }, cutoffText: { color: "#2A7138", fontSize: 12, fontWeight: "900" }, resultText: { color: "#63726A", textAlign: "center", fontSize: 13, lineHeight: 19, marginTop: 15, maxWidth: 290 }, resultActions: { width: "100%", gap: 9, marginTop: 23 }, secondaryButton: { alignItems: "center", paddingVertical: 12 }, secondaryText: { color: "#28783B", fontSize: 13, fontWeight: "900" }, empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 11 }, emptyTitle: { color: "#173820", fontSize: 22, fontWeight: "900" }, emptyText: { color: "#607268", fontSize: 13, lineHeight: 19, textAlign: "center", marginBottom: 8 },
});
