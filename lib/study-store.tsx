import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { Confidence, LESSONS, Lesson, QUESTIONS, SUBJECTS } from "@/lib/study-data";
import { calculateNextStreak, calculateSubjectScore, xpForAnswer } from "@/lib/study-rules";
import { hydrateStudyState, serializeStudyState } from "@/lib/study-persistence";
import { EditorialQuestion, EditorialStatus, MaterialProcessingStage, nextProcessingStage, ProcessableMaterial, TheoryArticle, TheoryReviewStatus } from "@/lib/content-models";
import { THEORY_LIBRARY } from "@/lib/theory-library";
import { SoundPreference } from "@/lib/sound-rules";
import { tacticalPointsForAnswer } from "@/lib/tactical-system";
import { DEFAULT_STUDY_SCHEDULE, StudySchedule } from "@/lib/study-schedule";
import { ContestSyllabus } from "@/lib/contest-syllabus";

export type AnswerRecord = {
  questionId: string;
  subjectId: string;
  topic: string;
  correct: boolean;
  confidence: Confidence;
  answeredAt: string;
};

export type MaterialRecord = ProcessableMaterial;

export type SimulationRecord = { id: string; completedAt: string; correct: number; total: number; accuracy: number; cutoff: number };
export type TopicMasteryRecord = { score: number; verifiedAt: string; status: "verified" | "needs_review" };

export type StudyState = {
  hasCompletedOnboarding: boolean;
  name: string;
  contestId?: string;
  contestTitle?: string;
  selectedSubjectIds: string[];
  answers: AnswerRecord[];
  completedLessonIds: string[];
  materials: MaterialRecord[];
  editorialQuestions: EditorialQuestion[];
  simulations: SimulationRecord[];
  weeklyPriorityLessonIds: string[];
  topicMastery: Record<string, TopicMasteryRecord>;
  theoryLibrary: TheoryArticle[];
  offlineTheoryIds: string[];
  studySchedule: StudySchedule;
  examDate?: string;
  contestSyllabus?: ContestSyllabus;
  xp: number;
  tacticalPoints: number;
  streak: number;
  lastStudyDate?: string;
  soundPreference: SoundPreference;
};

type StudyContextValue = {
  state: StudyState;
  isHydrated: boolean;
  setProfile: (name: string, contestId: string, subjectIds: string[]) => void;
  setContestTitle: (title?: string) => void;
  recordAnswer: (questionId: string, confidence: Confidence, selectedIndex: number) => boolean;
  completeLesson: (lesson: Lesson) => void;
  addMaterial: (material: Omit<MaterialRecord, "stage" | "progress">) => void;
  setMaterialDiscipline: (materialId: string, discipline: string) => void;
  setMaterialProcessing: (materialId: string, stage: MaterialProcessingStage, progress: number, note?: string) => void;
  setMaterialAnalysis: (materialId: string, remoteUrl: string, analysis: NonNullable<MaterialRecord["analysis"]>) => void;
  addEditorialQuestion: (question: EditorialQuestion) => void;
  addSimulation: (simulation: SimulationRecord) => void;
  setWeeklyPriorities: (lessonIds: string[]) => void;
  setTopicMastery: (subjectId: string, topic: string, record: TopicMasteryRecord) => void;
  upsertTheoryArticle: (article: TheoryArticle) => void;
  setTheoryReviewStatus: (articleId: string, status: TheoryReviewStatus) => void;
  saveTheoryOffline: (articleId: string) => void;
  removeTheoryOffline: (articleId: string) => void;
  setEditorialQuestionStatus: (questionId: string, status: EditorialStatus) => void;
  setSoundPreference: (preference: SoundPreference) => void;
  setStudySchedule: (schedule: StudySchedule) => void;
  setExamDate: (examDate?: string) => void;
  setContestSyllabus: (syllabus?: ContestSyllabus) => void;
  resetDemo: () => void;
  getSubjectScore: (subjectId: string) => number | null;
  getSubjectWeakTopics: (subjectId: string) => string[];
};

const STORAGE_KEY = "duoduo-study-state-v1";

const initialState: StudyState = {
  hasCompletedOnboarding: false,
  name: "",
  selectedSubjectIds: [],
  answers: [],
  completedLessonIds: [],
  materials: [],
  editorialQuestions: [],
  simulations: [],
  weeklyPriorityLessonIds: [],
  topicMastery: {},
  theoryLibrary: THEORY_LIBRARY,
  offlineTheoryIds: [],
  studySchedule: DEFAULT_STUDY_SCHEDULE,
  xp: 0,
  tacticalPoints: 0,
  streak: 0,
  soundPreference: { preset: "dino" },
};

const StudyContext = createContext<StudyContextValue | undefined>(undefined);

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function previousDateKey() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateKey(yesterday);
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudyState>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        const hydrated = hydrateStudyState(stored, initialState) as StudyState & { soundEffectsEnabled?: boolean };
        setState({
          ...hydrated,
          soundPreference: hydrated.soundPreference ?? { preset: hydrated.soundEffectsEnabled === false ? "silent" : "dino" },
          studySchedule: hydrated.studySchedule ?? DEFAULT_STUDY_SCHEDULE,
        });
      })
      .finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (isHydrated) AsyncStorage.setItem(STORAGE_KEY, serializeStudyState(state));
  }, [state, isHydrated]);

  const setProfile = (name: string, contestId: string, subjectIds: string[]) => {
    setState((current) => ({ ...current, hasCompletedOnboarding: true, name: name.trim(), contestId, selectedSubjectIds: subjectIds }));
  };
  const setContestTitle = (contestTitle?: string) => setState((current) => ({ ...current, contestTitle }));

  const recordAnswer = (questionId: string, confidence: Confidence, selectedIndex: number) => {
    const question = [...QUESTIONS, ...state.editorialQuestions.filter((item) => item.status === "published").map((item) => ({ id: item.id, subjectId: item.discipline, topic: item.topic, prompt: item.stem, options: item.alternatives, correctIndex: item.correctIndex, explanation: item.explanation }))].find((item) => item.id === questionId);
    if (!question) return false;
    const correct = selectedIndex === question.correctIndex;
    const today = dateKey();
    setState((current) => {
      const answers = [...current.answers.filter((answer) => answer.questionId !== questionId), {
        questionId,
        subjectId: question.subjectId,
        topic: question.topic,
        correct,
        confidence,
        answeredAt: new Date().toISOString(),
      }];
      const streak = calculateNextStreak(current.streak, current.lastStudyDate, today, previousDateKey());
      const firstAttempt = !current.answers.some((answer) => answer.questionId === questionId);
      return { ...current, answers, xp: current.xp + xpForAnswer(correct), tacticalPoints: current.tacticalPoints + tacticalPointsForAnswer({ correct, firstAttempt }), streak, lastStudyDate: today };
    });
    return correct;
  };

  const completeLesson = (lesson: Lesson) => {
    setState((current) => current.completedLessonIds.includes(lesson.id)
      ? current
      : { ...current, completedLessonIds: [...current.completedLessonIds, lesson.id], xp: current.xp + 5, tacticalPoints: current.tacticalPoints + 25 });
  };

  const addMaterial = (material: Omit<MaterialRecord, "stage" | "progress">) => setState((current) => ({
    ...current,
    materials: [{ ...material, stage: "queued", progress: 0 }, ...current.materials],
  }));

  const setMaterialDiscipline = (materialId: string, discipline: string) => setState((current) => ({ ...current, materials: current.materials.map((material) => material.id === materialId ? { ...material, discipline } : material) }));
  const setMaterialProcessing = (materialId: string, stage: MaterialProcessingStage, progress: number, note?: string) => setState((current) => ({ ...current, materials: current.materials.map((material) => material.id === materialId ? { ...material, stage, progress, note } : material) }));
  const setMaterialAnalysis = (materialId: string, remoteUrl: string, analysis: NonNullable<MaterialRecord["analysis"]>) => setState((current) => ({ ...current, materials: current.materials.map((material) => material.id === materialId ? { ...material, stage: "ready", progress: 100, remoteUrl, analysis, note: undefined } : material) }));
  const addEditorialQuestion = (question: EditorialQuestion) => setState((current) => ({ ...current, editorialQuestions: [question, ...current.editorialQuestions] }));
  const addSimulation = (simulation: SimulationRecord) => setState((current) => ({ ...current, simulations: [simulation, ...current.simulations] }));
  const setWeeklyPriorities = (weeklyPriorityLessonIds: string[]) => setState((current) => ({ ...current, weeklyPriorityLessonIds: weeklyPriorityLessonIds.slice(0, 3) }));
  const setTopicMastery = (subjectId: string, topic: string, record: TopicMasteryRecord) => setState((current) => ({ ...current, topicMastery: { ...current.topicMastery, [`${subjectId}::${topic}`]: record } }));
  const upsertTheoryArticle = (article: TheoryArticle) => setState((current) => ({ ...current, theoryLibrary: [article, ...current.theoryLibrary.filter((item) => item.subjectId !== article.subjectId || item.topic !== article.topic)] }));
  const setTheoryReviewStatus = (articleId: string, reviewStatus: TheoryReviewStatus) => setState((current) => ({ ...current, theoryLibrary: current.theoryLibrary.map((article) => article.id === articleId ? { ...article, reviewStatus, updatedAt: new Date().toISOString().slice(0, 10) } : article) }));
  const saveTheoryOffline = (articleId: string) => setState((current) => current.offlineTheoryIds.includes(articleId) ? current : { ...current, offlineTheoryIds: [...current.offlineTheoryIds, articleId] });
  const removeTheoryOffline = (articleId: string) => setState((current) => ({ ...current, offlineTheoryIds: current.offlineTheoryIds.filter((id) => id !== articleId) }));
  const setEditorialQuestionStatus = (questionId: string, status: EditorialStatus) => setState((current) => ({ ...current, editorialQuestions: current.editorialQuestions.map((question) => question.id === questionId ? { ...question, status } : question) }));

  const setSoundPreference = (soundPreference: SoundPreference) => setState((current) => ({ ...current, soundPreference }));
  const setStudySchedule = (studySchedule: StudySchedule) => setState((current) => ({ ...current, studySchedule }));
  const setExamDate = (examDate?: string) => setState((current) => ({ ...current, examDate }));
  const setContestSyllabus = (contestSyllabus?: ContestSyllabus) => setState((current) => ({ ...current, contestSyllabus }));

  const resetDemo = () => setState(initialState);

  const getSubjectScore = (subjectId: string) => {
    const relevant = state.answers.filter((answer) => answer.subjectId === subjectId);
    if (!relevant.length) return null;
    return calculateSubjectScore(relevant);
  };

  const getSubjectWeakTopics = (subjectId: string) => {
    const subject = SUBJECTS.find((item) => item.id === subjectId);
    if (!subject) return [];
    return subject.topics.filter((topic) => {
      const responses = state.answers.filter((answer) => answer.subjectId === subjectId && answer.topic === topic);
      return !responses.length || responses.some((response) => !response.correct || response.confidence !== "know");
    });
  };

  const value = useMemo(() => ({ state, isHydrated, setProfile, setContestTitle, recordAnswer, completeLesson, addMaterial, setMaterialDiscipline, setMaterialProcessing, setMaterialAnalysis, addEditorialQuestion, addSimulation, setWeeklyPriorities, setTopicMastery, upsertTheoryArticle, setTheoryReviewStatus, saveTheoryOffline, removeTheoryOffline, setEditorialQuestionStatus, setSoundPreference, setStudySchedule, setExamDate, setContestSyllabus, resetDemo, getSubjectScore, getSubjectWeakTopics }), [state, isHydrated]);
  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) throw new Error("useStudy deve ser usado dentro de StudyProvider");
  return context;
}

/**
 * Nivelamento estilo Duolingo: curto, mas cobre ao menos metade das matérias.
 * Até 2 questões por matéria amostrada, no máximo 8 questões no total.
 */
export function getStarterQuestions(subjectIds: string[], editorialQuestions: EditorialQuestion[] = []) {
  const publishedQuestions = editorialQuestions
    .filter((item) => item.status === "published")
    .map((item) => ({
      id: item.id,
      subjectId: item.discipline,
      topic: item.topic,
      prompt: item.stem,
      options: item.alternatives,
      correctIndex: item.correctIndex,
      explanation: item.explanation,
    }));
  const pool = [...QUESTIONS, ...publishedQuestions];
  if (!subjectIds.length) return pool.slice(0, 4);

  const half = Math.max(1, Math.ceil(subjectIds.length / 2));
  const sampled = subjectIds.slice(0, half);
  const picked = sampled.flatMap((subjectId) =>
    pool.filter((question) => question.subjectId === subjectId).slice(0, 2),
  );
  // Garante pelo menos algumas questões mesmo se o banco local estiver enxuto
  if (picked.length >= 4) return picked.slice(0, 8);
  return [...picked, ...pool.filter((q) => !picked.some((p) => p.id === q.id))].slice(0, 8);
}

export function getRecommendedLesson(completedLessonIds: string[], subjectIds: string[]) {
  return LESSONS.find((lesson: Lesson) => subjectIds.includes(lesson.subjectId) && !completedLessonIds.includes(lesson.id));
}
