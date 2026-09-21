import { LESSONS, SUBJECTS, type Lesson } from "./study-data";

export type TacticalAnswer = { correct: boolean; confidence: "know" | "guess" | "dont_know"; subjectId: string; topic: string };

export type Badge = {
  id: string;
  label: string;
  icon: "military-tech" | "local-fire-department" | "psychology" | "verified" | "stars";
  unlocked: boolean;
};

export type TacticalRank = {
  title: "Soldado" | "Cabo" | "Sargento" | "Tenente" | "Capitão" | "Comandante";
  threshold: number;
  nextTitle?: string;
  progressToNext: number;
};

export type TacticalMission = {
  id: string;
  subjectId: string;
  subjectTitle: string;
  topic: string;
  lesson?: Lesson;
  status: "completed" | "active" | "locked";
};

const medalDefinitions: Omit<Badge, "unlocked">[] = [
  { id: "primeiro-passo", label: "Primeiro passo", icon: "military-tech" },
  { id: "atirador-preciso", label: "Mira precisa", icon: "verified" },
  { id: "ritmo-tatico", label: "Ritmo tático", icon: "local-fire-department" },
  { id: "analista", label: "Análise de campo", icon: "psychology" },
  { id: "vanguarda", label: "Vanguarda", icon: "stars" },
  { id: "consistencia", label: "Constância", icon: "local-fire-department" },
];

const ranks: Array<Pick<TacticalRank, "title" | "threshold">> = [
  { title: "Soldado", threshold: 0 },
  { title: "Cabo", threshold: 3 },
  { title: "Sargento", threshold: 6 },
  { title: "Tenente", threshold: 10 },
  { title: "Capitão", threshold: 15 },
  { title: "Comandante", threshold: 20 },
];

export function getBadges(input: { xp: number; streak: number; completedLessonIds: string[]; answers: TacticalAnswer[] }): Badge[] {
  const correct = input.answers.filter((answer) => answer.correct).length;
  const reviewed = input.answers.filter((answer) => !answer.correct || answer.confidence !== "know").length;
  const unlocked = [
    input.xp >= 5 || input.completedLessonIds.length >= 1,
    correct >= 5,
    input.streak >= 3,
    reviewed >= 3,
    input.completedLessonIds.length >= 4 || input.xp >= 60,
    input.streak >= 7,
  ];
  return medalDefinitions.map((badge, index) => ({ ...badge, unlocked: unlocked[index] }));
}

export function getTacticalRank(badgeCount: number): TacticalRank {
  const position = ranks.findLastIndex((rank) => badgeCount >= rank.threshold);
  const current = ranks[Math.max(0, position)];
  const next = ranks[position + 1];
  const progressToNext = next ? Math.min(1, Math.max(0, (badgeCount - current.threshold) / (next.threshold - current.threshold))) : 1;
  return { title: current.title, threshold: current.threshold, nextTitle: next?.title, progressToNext };
}

export function buildTacticalMissions(selectedSubjectIds: string[], completedLessonIds: string[], weeklyPriorityLessonIds: string[] = [], verifiedTopics: string[] = []): TacticalMission[] {
  const subjects = SUBJECTS.filter((subject) => selectedSubjectIds.includes(subject.id));
  const missions = subjects.flatMap((subject) => subject.topics.map((topic, topicIndex) => {
    const lesson = LESSONS.find((item) => item.subjectId === subject.id && item.topic === topic);
    return { id: lesson?.id ?? `${subject.id}-${topicIndex}`, subjectId: subject.id, subjectTitle: subject.shortTitle, topic, lesson, status: "locked" as const };
  }));
  const prioritize = weeklyPriorityLessonIds.length > 0;
  const orderedMissions = prioritize ? [...missions].sort((left, right) => Number(Boolean(right.lesson && weeklyPriorityLessonIds.includes(right.lesson.id))) - Number(Boolean(left.lesson && weeklyPriorityLessonIds.includes(left.lesson.id)))) : missions;
  let nextMissionAvailable = false;
  return orderedMissions.map((mission) => {
    const completed = (mission.lesson ? completedLessonIds.includes(mission.lesson.id) : false) || verifiedTopics.includes(`${mission.subjectId}::${mission.topic}`);
    if (completed) return { ...mission, status: "completed" };
    const isPriority = Boolean(mission.lesson && weeklyPriorityLessonIds.includes(mission.lesson.id));
    if (!nextMissionAvailable && mission.lesson && (!prioritize || isPriority)) {
      nextMissionAvailable = true;
      return { ...mission, status: "active" };
    }
    return mission;
  });
}

export function getTacticalSummary(input: { xp: number; streak: number; completedLessonIds: string[]; answers: TacticalAnswer[]; selectedSubjectIds: string[]; weeklyPriorityLessonIds?: string[]; verifiedTopics?: string[] }) {
  const badges = getBadges(input);
  return { badges, badgeCount: badges.filter((badge) => badge.unlocked).length, rank: getTacticalRank(badges.filter((badge) => badge.unlocked).length), missions: buildTacticalMissions(input.selectedSubjectIds, input.completedLessonIds, input.weeklyPriorityLessonIds, input.verifiedTopics) };
}
