import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Svg, { Circle } from "react-native-svg";
import { router } from "expo-router";
import { useMemo } from "react";

import { DuoduoMascot } from "@/components/duoduo-mascot";
import { ScreenContainer } from "@/components/screen-container";
import { TacticalMap } from "@/components/tactical-map";
import { getLocalPoliceContest } from "@/lib/contest-catalog";
import { getRecommendedLesson, useStudy } from "@/lib/study-store";
import { getSubject, LESSONS } from "@/lib/study-data";
import { getTacticalSummary, type TacticalMission } from "@/lib/tactical-progress";
import { getRankForPoints, getTacticalBriefs } from "@/lib/tactical-system";
import { buildCatalogSyllabus, syllabusProgress } from "@/lib/contest-syllabus";
import { examCountdownLabel } from "@/lib/study-schedule";
import { generateMentorshipPlan, getMascotLine } from "@/lib/mentorship-engine";
import { useSubscription } from "@/lib/subscription-store";
import { FREE_MAX_RANK_LEVEL, formatBRL, PRICING } from "@/lib/subscription";

export default function ArenaScreen() {
  const { state, getSubjectScore, getSubjectWeakTopics } = useStudy();
  const { isPro, remainingSeconds } = useSubscription();
  const catalogContest = getLocalPoliceContest(state.contestId);
  const contest = state.contestTitle ? { ...catalogContest, title: state.contestTitle } : catalogContest;
  const displayName = state.name || "Candidato";
  const firstName = displayName.split(" ")[0];
  const completedTopicKeys = LESSONS.filter((lesson) => state.completedLessonIds.includes(lesson.id)).map((lesson) => `${lesson.subjectId}::${lesson.topic}`);
  const edict = syllabusProgress(state.contestSyllabus ?? buildCatalogSyllabus(contest.title, state.selectedSubjectIds), completedTopicKeys);
  const progress = edict.total ? edict.completed / edict.total : 0;
  const tactical = getTacticalSummary({ xp: state.xp, streak: state.streak, completedLessonIds: state.completedLessonIds, answers: state.answers, selectedSubjectIds: state.selectedSubjectIds, weeklyPriorityLessonIds: state.weeklyPriorityLessonIds, verifiedTopics: Object.entries(state.topicMastery).filter(([, record]) => record.status === "verified").map(([key]) => key) });
  const tacticalRank = getRankForPoints(state.tacticalPoints);
  const completedTopics = LESSONS.filter((lesson) => state.completedLessonIds.includes(lesson.id)).map((lesson) => lesson.topic);
  const criticalTopics = [...new Set(state.answers.filter((answer) => !answer.correct || answer.confidence !== "know").map((answer) => answer.topic))];
  const tacticalBriefs = getTacticalBriefs({ attempts: state.answers, completedTopics, streak: state.streak, criticalTopics });
  const earnedBriefs = tacticalBriefs.filter((brief) => brief.status === "earned").length;
  const activeMission = tactical.missions.find((mission) => mission.status === "active");
  const recommendedLesson = activeMission?.lesson ?? getRecommendedLesson(state.completedLessonIds, state.selectedSubjectIds);
  const weakest = state.selectedSubjectIds.map((subjectId) => ({ subjectId, score: getSubjectScore(subjectId) ?? 0 })).sort((left, right) => left.score - right.score)[0];
  const weakSubject = weakest ? getSubject(weakest.subjectId) : undefined;
  const weakTopic = weakSubject ? getSubjectWeakTopics(weakSubject.id)[0] : undefined;
  const countdown = examCountdownLabel(state.examDate);

  // Mentoria local personalizada
  const mentorship = useMemo(() => generateMentorshipPlan(state), [state]);
  const mascotLine = getMascotLine(mentorship);

  const openMission = (mission: TacticalMission) => {
    if (mission.lesson) router.push({ pathname: "/theory" as never, params: { subjectId: mission.lesson.subjectId, topic: mission.lesson.topic } } as never);
  };

  const openGoal = (goal: typeof mentorship.goals[0]) => {
    if (goal.lessonId) {
      router.push({ pathname: "/lesson" as never, params: { id: goal.lessonId } } as never);
      return;
    }
    if (goal.subjectId && goal.topic) {
      router.push({ pathname: "/theory" as never, params: { subjectId: goal.subjectId, topic: goal.topic } } as never);
      return;
    }
    if (goal.type === "review" && goal.topic) {
      router.push("/(tabs)/diagnosis" as never);
      return;
    }
    if (goal.type === "simulation") {
      router.push("/simulation" as never);
      return;
    }
    router.push("/(tabs)/diagnosis" as never);
  };

  return <ScreenContainer containerClassName="bg-[#DFF0D6]" className="px-0">
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.shell}>
        <View style={styles.hero}>
          <View style={styles.brandRow}><View style={styles.brand}><DuoduoMascot size={49} /><View><Text style={styles.brandName}>DINO</Text><Text style={styles.brandSub}>Carreira militar & segurança</Text></View></View><View style={styles.profileMini}><View style={styles.avatar}><MaterialIcons name="person" size={25} color="#375248" /></View><View><Text style={styles.greeting}>OLÁ, {firstName.toUpperCase()}!</Text><Text style={styles.training}>EM PREPARAÇÃO</Text></View></View></View>
          <View style={styles.heroMain}><View style={styles.contestCopy}><Text style={styles.label}>OBJETIVO:</Text><Text style={styles.contest}>{contest.title}</Text><Text style={styles.labelDate}>CRONOGRAMA:</Text><Text style={styles.dateValue}>{contest.dateLabel}</Text><Text style={styles.countdown}>{countdown}</Text><Text style={styles.edictMeta}>{edict.completed}/{edict.total} temas estudados</Text></View><EdictRing progress={progress} /></View>
        </View>

        <View style={styles.missionPanel}>
          <TacticalMap
            missions={tactical.missions}
            onMissionPress={openMission}
            focusMissionId={mentorship.focusLessonId}
            focusTopic={mentorship.focusTopic}
          />
          <View style={styles.indicators}>
            <Text style={styles.indicatorLabel}>INDICADORES</Text>
            <View style={styles.indicatorMain}>
              <Text style={styles.indicatorTitle}>OFENSIVA:</Text>
              <View style={styles.indicatorValue}>
                <MaterialIcons name="local-fire-department" size={22} color="#FFB21D" />
                <Text style={styles.indicatorNumber}>{state.streak || 0}</Text>
                <Text style={styles.indicatorUnit}>DIAS</Text>
              </View>
              <View style={styles.indicatorLine} />
              <Text style={styles.indicatorTitle}>PATENTE:</Text>
              <Text style={styles.rankName}>{tacticalRank.title.toUpperCase()}</Text>
              <Text style={styles.rankNext}>
                nível {tacticalRank.level} · {state.tacticalPoints.toLocaleString("pt-BR")} PT
              </Text>
              {mentorship.rankProgress.nextTitle ? (
                <Text style={styles.rankProgressText}>
                  {mentorship.rankProgress.progressPercent}% → {mentorship.rankProgress.nextTitle}
                </Text>
              ) : null}
              <View style={styles.indicatorLine} />
              <Text style={styles.indicatorTitle}>BREVÊS:</Text>
              <View style={styles.badgeCount}>
                <MaterialIcons name="military-tech" size={22} color="#FFCC48" />
                <Text style={styles.indicatorNumber}>{earnedBriefs}</Text>
              </View>
              <View style={styles.badgeRow}>
                {tacticalBriefs.slice(0, 4).map((brief) => (
                  <MaterialIcons
                    key={brief.id}
                    name="military-tech"
                    size={15}
                    color={brief.status === "earned" ? "#FFE07B" : brief.status === "maintenance" ? "#FFA970" : "#6A9872"}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Mensagem da Mentoria do Dino */}
        <View style={styles.mentorCard}>
          <View style={styles.mentorHeader}>
            <DuoduoMascot size={42} />
            <View style={{ flex: 1 }}>
              <Text style={styles.mentorHeadline}>{mentorship.message.headline}</Text>
              <Text style={styles.mentorLine}>{mascotLine}</Text>
            </View>
          </View>
          <Text style={styles.mentorBody}>{mentorship.message.body}</Text>
          {mentorship.estimatedTotalMinutes > 0 && (
            <Text style={styles.mentorMeta}>Tempo estimado hoje: ~{mentorship.estimatedTotalMinutes} min</Text>
          )}
        </View>

        {!isPro && (
          <Pressable
            onPress={() => router.push({ pathname: "/paywall" as never, params: { reason: remainingSeconds <= 0 ? "daily_limit" : "generic" } } as never)}
            style={styles.freeBanner}
          >
            <MaterialIcons name="timer" size={18} color="#1F5E32" />
            <Text style={styles.freeBannerText}>
              {remainingSeconds <= 0
                ? "Tempo diário esgotado · Desbloqueie o Pro"
                : `Plano gratuito · ${Math.floor(remainingSeconds / 60)} min restantes hoje`}
            </Text>
            <MaterialIcons name="chevron-right" size={18} color="#1F5E32" />
          </Pressable>
        )}

        <View style={styles.planHeader}><Text style={styles.planTitle}>PLANO TÁTICO HOJE</Text><Text style={styles.win}>VÁ E VENÇA!</Text></View>
        <View style={styles.planCard}>
          {mentorship.goals.filter((g) => g.type !== "streak").slice(0, 3).map((goal, index) => (
            <PlanItem
              key={goal.id}
              color={goal.priority === "high" ? "#D4554B" : goal.priority === "medium" ? "#D6C800" : "#238238"}
              icon={goal.type === "lesson" ? "play-arrow" : goal.type === "review" ? "auto-stories" : goal.type === "simulation" ? "emoji-events" : "refresh"}
              title={goal.title}
              detail={goal.detail}
              onPress={() => openGoal(goal)}
            />
          ))}
          {mentorship.goals.filter((g) => g.type !== "streak").length === 0 && (
            <>
              <PlanItem color="#D6C800" icon="auto-stories" title={weakSubject && weakTopic ? `Teoria: ${weakSubject.shortTitle} · ${weakTopic}` : "Revisão estratégica"} detail={weakSubject && weakTopic ? "Revise a base antes de praticar novas questões" : "Faça o nivelamento para personalizar sua revisão"} onPress={() => weakSubject && weakTopic ? router.push({ pathname: "/theory" as never, params: { subjectId: weakSubject.id, topic: weakTopic } } as never) : router.push("/(tabs)/diagnosis" as never)} />
              {recommendedLesson ? <PlanItem color="#D4554B" icon="play-arrow" title={recommendedLesson.title} detail={`${getSubject(recommendedLesson.subjectId)?.shortTitle ?? "Disciplina"} · ${recommendedLesson.durationMinutes} min + questão`} onPress={() => router.push({ pathname: "/lesson" as never, params: { id: recommendedLesson.id } } as never)} /> : <PlanItem color="#238238" icon="emoji-events" title="Mapa concluído" detail="Você concluiu as lições disponíveis. Revise seu diagnóstico." onPress={() => router.push("/(tabs)/diagnosis" as never)} />}
            </>
          )}
        </View>
        <View style={styles.briefs}><Text style={styles.briefsTitle}>SEUS BREVÊS</Text><View style={styles.briefsList}>{tacticalBriefs.slice(0, 3).map((brief) => <View key={brief.id} style={[styles.brief, brief.status !== "earned" && styles.briefLocked]}><MaterialIcons name="military-tech" size={18} color={brief.status === "earned" ? "#BD7D00" : brief.status === "maintenance" ? "#B24A17" : "#90A39A"} /><Text style={[styles.briefText, brief.status !== "earned" && styles.briefTextLocked]}>{brief.status === "maintenance" ? `${brief.title} · manutenção` : brief.title}</Text></View>)}</View></View>
      </View>
    </ScrollView>
  </ScreenContainer>;
}

function EdictRing({ progress }: { progress: number }) {
  const size = 116; const radius = 45; const circumference = 2 * Math.PI * radius; const value = Math.max(0.03, Math.min(1, progress));
  return <View style={styles.ringWrap}><Svg width={size} height={size} viewBox="0 0 116 116"><Circle cx="58" cy="58" r={radius} stroke="#E2E4E2" strokeWidth="12" fill="none" /><Circle cx="58" cy="58" r={radius} stroke="#177B2B" strokeWidth="12" strokeLinecap="round" fill="none" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - value)} transform="rotate(-90 58 58)" /></Svg><View style={styles.ringCenter}><MaterialIcons name="shield" size={25} color="#1A6229" /><Text style={styles.ringValue}>{Math.round(progress * 100)}%</Text><Text style={styles.ringLabel}>DO EDITAL</Text></View></View>;
}

function PlanItem({ color, icon, title, detail, onPress }: { color: string; icon: "refresh" | "play-arrow" | "emoji-events" | "auto-stories" | "local-fire-department"; title: string; detail: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.planItem, pressed && styles.planPressed]}><View style={[styles.planBand, { backgroundColor: color }]} /><MaterialIcons name={icon} size={22} color={color} /><View style={styles.planCopy}><Text style={styles.planItemTitle} numberOfLines={2}>{title}</Text><Text style={styles.planItemDetail} numberOfLines={2}>{detail}</Text></View><MaterialIcons name="chevron-right" size={22} color="#809087" /></Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 20 }, shell: { width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 14, paddingTop: 12 }, hero: { backgroundColor: "#FFFFFF", borderRadius: 25, padding: 16, borderWidth: 1, borderColor: "#D8E4D2", shadowColor: "#163020", shadowOpacity: 0.11, shadowRadius: 10, elevation: 3 }, brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, brand: { flexDirection: "row", alignItems: "center", gap: 6 }, brandName: { color: "#187837", fontSize: 28, fontWeight: "900", letterSpacing: -1 }, brandSub: { color: "#284B31", fontSize: 10, fontWeight: "800", marginTop: -3 }, profileMini: { flexDirection: "row", alignItems: "center", gap: 6 }, avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#E5E8E6", alignItems: "center", justifyContent: "center" }, greeting: { color: "#172C1B", fontSize: 11, fontWeight: "900" }, training: { color: "#55705B", fontSize: 8, fontWeight: "900", marginTop: 1 }, heroMain: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 13 }, contestCopy: { flex: 1, paddingRight: 5 }, label: { color: "#111C14", fontSize: 11, fontWeight: "900" }, contest: { color: "#102A43", fontSize: 19, lineHeight: 21, fontWeight: "900", marginTop: 2 }, labelDate: { color: "#111C14", fontSize: 10, fontWeight: "900", marginTop: 11 }, dateValue: { color: "#238238", fontSize: 17, fontWeight: "900", marginTop: 1 }, countdown: { color: "#9A6900", fontSize: 10, fontWeight: "900", marginTop: 4 }, edictMeta: { color: "#587162", fontSize: 10, fontWeight: "800", marginTop: 3 }, ringWrap: { width: 116, height: 116, alignItems: "center", justifyContent: "center" }, ringCenter: { position: "absolute", alignItems: "center", justifyContent: "center" }, ringValue: { color: "#1C3A23", fontSize: 17, fontWeight: "900", marginTop: -1 }, ringLabel: { color: "#263A2A", fontSize: 8, fontWeight: "900" }, missionPanel: { flexDirection: "row", marginTop: 12, gap: 8 }, indicators: { width: 112, borderRadius: 20, overflow: "hidden", backgroundColor: "#D8EFCE" }, indicatorLabel: { color: "#285B31", fontSize: 9, fontWeight: "900", letterSpacing: 0.6, padding: 11, paddingBottom: 5 }, indicatorMain: { margin: 5, borderRadius: 15, backgroundColor: "#28743A", padding: 10 }, indicatorTitle: { color: "#E8F9DE", fontSize: 9, fontWeight: "900" }, indicatorValue: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 3 }, indicatorNumber: { color: "#FFFFFF", fontSize: 21, fontWeight: "900" }, indicatorUnit: { color: "#E3F6DB", fontSize: 9, fontWeight: "900", alignSelf: "flex-end", marginBottom: 4 }, indicatorLine: { height: 1, backgroundColor: "#71B47C", marginVertical: 8 }, rankName: { color: "#FFFFFF", fontSize: 15, fontWeight: "900", marginTop: 3 }, rankNext: { color: "#C6E9C7", fontSize: 8, fontWeight: "700", marginTop: 1 }, rankProgressText: { color: "#B8E0B8", fontSize: 8, fontWeight: "800", marginTop: 3 }, badgeCount: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 }, badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginTop: 6 }, planHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF", marginTop: 12, paddingHorizontal: 14, paddingVertical: 12, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderWidth: 1, borderBottomWidth: 0, borderColor: "#DDE6DA" }, planTitle: { color: "#122415", fontSize: 15, fontWeight: "900" }, win: { color: "#238238", fontSize: 14, fontWeight: "900" }, planCard: { backgroundColor: "#FFFFFF", paddingHorizontal: 13, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, borderWidth: 1, borderTopWidth: 0, borderColor: "#DDE6DA" }, planItem: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 9, borderBottomWidth: 1, borderColor: "#E3E8E2" }, planBand: { width: 5, height: 38, borderRadius: 4 }, planCopy: { flex: 1 }, planItemTitle: { color: "#162C1B", fontSize: 13, fontWeight: "900", textTransform: "uppercase" }, planItemDetail: { color: "#657169", fontSize: 10, marginTop: 2, fontWeight: "700" }, planPressed: { opacity: 0.68 }, briefs: { marginTop: 13, backgroundColor: "#FFFFFF", borderRadius: 17, padding: 13, borderWidth: 1, borderColor: "#DDE6DA" }, briefsTitle: { color: "#1E4827", fontSize: 11, fontWeight: "900", letterSpacing: 0.6 }, briefsList: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 9 }, brief: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#FFF3C4", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7 }, briefLocked: { backgroundColor: "#EEF1EF" }, briefText: { color: "#765300", fontSize: 10, fontWeight: "900" }, briefTextLocked: { color: "#718078" },
  mentorCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 14, marginTop: 12, borderWidth: 1, borderColor: "#D8E4D2", shadowColor: "#163020", shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  mentorHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  mentorHeadline: { color: "#122415", fontSize: 15, fontWeight: "900", lineHeight: 19 },
  mentorLine: { color: "#2E6B3A", fontSize: 12, fontWeight: "700", marginTop: 2 },
  mentorBody: { color: "#3A4F40", fontSize: 13, lineHeight: 19, fontWeight: "600" },
  mentorMeta: { color: "#6B7F70", fontSize: 11, fontWeight: "700", marginTop: 8 }, freeBanner: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EAF6E8", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#C5E6BC" }, freeBannerText: { flex: 1, color: "#1A4D28", fontSize: 12, fontWeight: "800" },
});
