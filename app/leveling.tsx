import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";

import { DuoduoMascot } from "@/components/duoduo-mascot";
import { PrimaryButton } from "@/components/primary-button";
import { ProgressBar } from "@/components/progress-bar";
import { ScreenContainer } from "@/components/screen-container";
import { StudyNavBar } from "@/components/study-nav-bar";
import { Confidence, getSubject } from "@/lib/study-data";
import { useAnswerAudio } from "@/lib/answer-audio";
import { haptic } from "@/lib/haptics";
import { getStarterQuestions, useStudy } from "@/lib/study-store";

export default function LevelingScreen() {
  const { state, recordAnswer } = useStudy();
  const { playAnswer } = useAnswerAudio(state.soundPreference);
  const questions = useMemo(() => getStarterQuestions(state.selectedSubjectIds, state.editorialQuestions), [state.selectedSubjectIds, state.editorialQuestions]);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<Confidence>("know");
  const [checked, setChecked] = useState(false);
  const question = questions[index];
  if (!question) { router.replace("/leveling-result" as any); return null; }
  const subject = getSubject(question.subjectId);
  const correct = choice === question.correctIndex;

  const submit = () => {
    if (choice === null) return;
    if (!checked) { recordAnswer(question.id, confidence, choice); setChecked(true); playAnswer(correct); if (correct) haptic.success(); else haptic.error(); return; }
    if (index === questions.length - 1) router.replace("/leveling-result" as any);
    else { setIndex((current) => current + 1); setChoice(null); setConfidence("know"); setChecked(false); }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      <View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={10}><MaterialIcons name="close" size={26} color="#31513A" /></Pressable><View style={styles.progressWrap}><ProgressBar value={((index + (checked ? 1 : 0)) / questions.length) * 100} /><Text style={styles.progressText}>{index + 1} de {questions.length}</Text></View><View style={styles.xpPill}><MaterialIcons name="bolt" size={17} color="#D99100" /><Text style={styles.xpText}>+10</Text></View></View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.subjectPill, { backgroundColor: `${subject?.color ?? "#39B54A"}18` }]}><View style={[styles.dot, { backgroundColor: subject?.color }]} /><Text style={[styles.subjectText, { color: subject?.color }]}>{subject?.shortTitle}</Text></View>
        <Text style={styles.title}>{checked ? (correct ? "Boa. Você acertou!" : "Quase lá. Vamos ajustar.") : "Vamos entender seu ponto de partida."}</Text>
        <Text style={styles.prompt}>{question.prompt}</Text>
        <View style={styles.options}>{question.options.map((option, optionIndex) => {
          const selected = choice === optionIndex;
          const outcome = checked && (optionIndex === question.correctIndex ? "correct" : selected ? "wrong" : "default");
          return <Pressable key={option} disabled={checked} onPress={() => { setChoice(optionIndex); haptic.selection(); }} style={({ pressed }) => [styles.option, selected && !checked && styles.optionSelected, outcome === "correct" && styles.optionCorrect, outcome === "wrong" && styles.optionWrong, pressed && !checked && styles.pressed]}><Text style={[styles.optionLetter, selected && styles.optionLetterSelected, outcome === "correct" && styles.correctText, outcome === "wrong" && styles.wrongText]}>{String.fromCharCode(65 + optionIndex)}</Text><Text style={[styles.optionText, outcome === "correct" && styles.correctText, outcome === "wrong" && styles.wrongText]}>{option}</Text>{outcome === "correct" && <MaterialIcons name="check-circle" size={22} color="#199B48" />}{outcome === "wrong" && <MaterialIcons name="cancel" size={22} color="#D34A42" />}</Pressable>;
        })}</View>
        {!checked && <View style={styles.confidence}><Text style={styles.confidenceTitle}>Como foi sua resposta?</Text><View style={styles.confidenceChoices}>{([ ["know", "Sabia", "sentiment-satisfied"], ["guess", "Chutei", "casino"], ["dont_know", "Não sei", "help-outline"] ] as const).map(([value, label, icon]) => <Pressable key={value} onPress={() => { setConfidence(value); haptic.selection(); }} style={[styles.confidenceItem, confidence === value && styles.confidenceSelected]}><MaterialIcons name={icon} size={19} color={confidence === value ? "#1F7A32" : "#667085"} /><Text style={[styles.confidenceLabel, confidence === value && styles.confidenceLabelSelected]}>{label}</Text></Pressable>)}</View></View>}
        {checked && <View style={[styles.feedback, correct ? styles.feedbackGood : styles.feedbackReview]}><DuoduoMascot size={45} /><View style={styles.feedbackCopy}><Text style={styles.feedbackTitle}>{correct ? "Raciocínio certo" : "Guarde este ponto"}</Text><Text style={styles.feedbackText}>{question.explanation}</Text></View></View>}
      </ScrollView>
      <View style={styles.actionDock}><PrimaryButton label={checked ? (index === questions.length - 1 ? "Ver meu diagnóstico" : "Próxima questão") : "Conferir resposta"} onPress={submit} disabled={choice === null} /><StudyNavBar /></View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 13, paddingTop: 8 }, progressWrap: { flex: 1, gap: 5 }, progressText: { textAlign: "center", fontSize: 11, color: "#667085", fontWeight: "700" }, xpPill: { flexDirection: "row", gap: 2, alignItems: "center", backgroundColor: "#FFF6D8", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 }, xpText: { color: "#9A6A00", fontWeight: "900", fontSize: 12 }, scroll: { flex: 1 }, actionDock: { gap: 9, paddingTop: 10, paddingBottom: 2, backgroundColor: "#FFFFFF" }, content: { paddingTop: 26, paddingBottom: 18 }, subjectPill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 7, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 }, dot: { width: 8, height: 8, borderRadius: 4 }, subjectText: { fontSize: 13, fontWeight: "900" }, title: { fontSize: 25, lineHeight: 31, color: "#102A43", fontWeight: "900", letterSpacing: -0.5, marginTop: 17 }, prompt: { fontSize: 18, lineHeight: 27, fontWeight: "600", color: "#243B53", marginTop: 19 }, options: { gap: 10, marginTop: 23 }, option: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: "#DCE8DE", borderRadius: 16, padding: 13 }, optionSelected: { borderColor: "#4FAE60", backgroundColor: "#F3FBF1" }, optionCorrect: { borderColor: "#31A75B", backgroundColor: "#EAF8EE" }, optionWrong: { borderColor: "#E2776E", backgroundColor: "#FFF1EF" }, optionLetter: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#EFF4F0", textAlign: "center", lineHeight: 28, color: "#667085", fontSize: 13, fontWeight: "900" }, optionLetterSelected: { color: "#1F7A32", backgroundColor: "#DDF5D4" }, optionText: { flex: 1, color: "#243B53", fontSize: 15, lineHeight: 21, fontWeight: "600" }, correctText: { color: "#18753C" }, wrongText: { color: "#B83C35" }, confidence: { marginTop: 23, backgroundColor: "#F0F5F0", borderRadius: 16, padding: 14 }, confidenceTitle: { color: "#31513A", fontSize: 13, fontWeight: "900", marginBottom: 10 }, confidenceChoices: { flexDirection: "row", gap: 7 }, confidenceItem: { flex: 1, minHeight: 68, alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 12, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E1EBE1" }, confidenceSelected: { backgroundColor: "#E7F8E3", borderColor: "#76CD83" }, confidenceLabel: { fontSize: 12, color: "#667085", fontWeight: "800" }, confidenceLabelSelected: { color: "#1F7A32" }, feedback: { flexDirection: "row", gap: 11, borderRadius: 18, padding: 14, marginTop: 20 }, feedbackGood: { backgroundColor: "#EAF8EE" }, feedbackReview: { backgroundColor: "#FFF6E4" }, feedbackCopy: { flex: 1 }, feedbackTitle: { fontSize: 15, color: "#102A43", fontWeight: "900", marginBottom: 4 }, feedbackText: { fontSize: 13, lineHeight: 19, color: "#3D5A47" }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
