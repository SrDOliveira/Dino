/**
 * Mentorship Engine – 100% local
 * Gera orientação personalizada, metas diárias e mensagens do Dino
 * com base no estado real do aluno (sem depender de API).
 *
 * Objetivo: funcionar como uma "babá tática" — lembra, corrige, motiva e direciona.
 */

import { LESSONS, type Lesson } from "./study-data";
import { getRankForPoints, TACTICAL_RANKS } from "./tactical-system";
import type { StudyState } from "./study-store";

export type MentorshipTone = "motivational" | "corrective" | "celebratory" | "urgent" | "steady";

export type DailyGoal = {
  id: string;
  title: string;
  detail: string;
  type: "lesson" | "review" | "theory" | "simulation" | "streak";
  priority: "high" | "medium" | "low";
  estimatedMinutes: number;
  lessonId?: string;
  subjectId?: string;
  topic?: string;
};

export type MentorshipMessage = {
  tone: MentorshipTone;
  headline: string;
  body: string;
  mascotMood: "happy" | "serious" | "proud" | "encouraging" | "alert";
};

export type MentorshipPlan = {
  message: MentorshipMessage;
  goals: DailyGoal[];
  focusSubjectId?: string;
  focusTopic?: string;
  focusLessonId?: string;
  weakTopics: string[];
  suggestedAction: "study_lesson" | "review_weak" | "do_theory" | "take_simulation" | "rest" | "leveling";
  estimatedTotalMinutes: number;
  rankProgress: {
    currentTitle: string;
    nextTitle?: string;
    pointsToNext: number;
    progressPercent: number;
  };
};

function getWeakTopics(state: StudyState, limit = 5): Array<{ topic: string; subjectId: string; accuracy: number; total: number }> {
  const topicStats = new Map<string, { correct: number; total: number; subjectId: string; topic: string }>();

  state.answers.forEach((answer) => {
    const key = `${answer.subjectId}::${answer.topic}`;
    const current = topicStats.get(key) ?? { correct: 0, total: 0, subjectId: answer.subjectId, topic: answer.topic };
    current.total += 1;
    if (answer.correct) current.correct += 1;
    topicStats.set(key, current);
  });

  return [...topicStats.values()]
    .filter((stats) => stats.total >= 2)
    .map((stats) => ({
      topic: stats.topic,
      subjectId: stats.subjectId,
      accuracy: stats.correct / stats.total,
      total: stats.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
    .slice(0, limit);
}

function getNextRecommendedLesson(state: StudyState): Lesson | undefined {
  const completed = new Set(state.completedLessonIds);
  const candidates = LESSONS.filter(
    (lesson) => state.selectedSubjectIds.includes(lesson.subjectId) && !completed.has(lesson.id),
  );

  if (state.weeklyPriorityLessonIds.length > 0) {
    const priority = candidates.find((l) => state.weeklyPriorityLessonIds.includes(l.id));
    if (priority) return priority;
  }

  return candidates[0];
}

function daysUntilExam(examDate?: string): number | null {
  if (!examDate) return null;
  const target = new Date(examDate);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
  return diff;
}

function getRankProgress(tacticalPoints: number) {
  const current = getRankForPoints(tacticalPoints);
  const currentIndex = TACTICAL_RANKS.findIndex((r) => r.level === current.level);
  const next = TACTICAL_RANKS[currentIndex + 1];

  if (!next) {
    return {
      currentTitle: current.title,
      nextTitle: undefined,
      pointsToNext: 0,
      progressPercent: 100,
    };
  }

  const range = (next.minPoints - current.minPoints) || 1;
  const progress = Math.min(1, Math.max(0, (tacticalPoints - current.minPoints) / range));

  return {
    currentTitle: current.title,
    nextTitle: next.title,
    pointsToNext: Math.max(0, next.minPoints - tacticalPoints),
    progressPercent: Math.round(progress * 100),
  };
}

/**
 * Gera o plano de mentoria do dia – totalmente local e determinístico.
 */
export function generateMentorshipPlan(state: StudyState): MentorshipPlan {
  const weakTopicsDetailed = getWeakTopics(state);
  const weakTopics = weakTopicsDetailed.map((w) => w.topic);
  const nextLesson = getNextRecommendedLesson(state);
  const rankProgress = getRankProgress(state.tacticalPoints);
  const daysLeft = daysUntilExam(state.examDate);
  const hasStreak = state.streak >= 1;
  const isNewUser = state.answers.length < 5 && state.completedLessonIds.length < 2;
  const answeredToday = state.answers.some((a) => {
    const answered = new Date(a.answeredAt);
    const today = new Date();
    return answered.toDateString() === today.toDateString();
  });

  const goals: DailyGoal[] = [];
  let focusSubjectId: string | undefined;
  let focusTopic: string | undefined;
  let focusLessonId: string | undefined;
  let suggestedAction: MentorshipPlan["suggestedAction"] = "study_lesson";
  let tone: MentorshipTone = "steady";
  let mascotMood: MentorshipMessage["mascotMood"] = "encouraging";
  let headline = "";
  let body = "";

  // === Lógica de prioridade da mentoria ===

  if (isNewUser) {
    tone = "motivational";
    mascotMood = "happy";
    headline = "Vamos começar sua jornada, soldado!";
    body = "Complete o nivelamento e as primeiras lições. O Dino vai montar seu plano tático personalizado a partir do seu desempenho real.";
    suggestedAction = "leveling";
    goals.push({
      id: "start-leveling",
      title: "Fazer o nivelamento",
      detail: "Descubra seus pontos fortes e fracos",
      type: "lesson",
      priority: "high",
      estimatedMinutes: 12,
    });
  } else if (daysLeft !== null && daysLeft <= 14) {
    // Fase crítica pré-prova
    tone = "urgent";
    mascotMood = "alert";
    headline = daysLeft <= 7 ? "Modo de prontidão máxima!" : "Fase final de preparação";
    body =
      daysLeft <= 3
        ? `Faltam apenas ${daysLeft} dias. Foque só no que ainda está fraco e faça simulados. Zero distração.`
        : `Faltam ${daysLeft} dias para a prova. Priorize revisão dos temas críticos e ritmo de prova.`;
    suggestedAction = weakTopicsDetailed.length > 0 ? "review_weak" : "take_simulation";

    if (weakTopicsDetailed.length > 0) {
      const weakest = weakTopicsDetailed[0];
      focusTopic = weakest.topic;
      focusSubjectId = weakest.subjectId;
      goals.push({
        id: "review-critical",
        title: `Revisar: ${weakest.topic}`,
        detail: `Precisão atual: ${Math.round(weakest.accuracy * 100)}% · tema prioritário`,
        type: "review",
        priority: "high",
        estimatedMinutes: 20,
        subjectId: weakest.subjectId,
        topic: weakest.topic,
      });
    }

    goals.push({
      id: "simulation-prep",
      title: "Simulado de prontidão",
      detail: "Treine no ritmo e pressão da prova",
      type: "simulation",
      priority: "high",
      estimatedMinutes: 30,
    });
  } else if (!hasStreak && !answeredToday) {
    // Quebrou a ofensiva
    tone = "corrective";
    mascotMood = "serious";
    headline = "Hora de retomar a ofensiva";
    body = "Você quebrou a sequência. Uma sessão curta hoje já reacende o ritmo. Disciplina vence talento inconsistente.";
    suggestedAction = "study_lesson";

    if (nextLesson) {
      focusSubjectId = nextLesson.subjectId;
      focusTopic = nextLesson.topic;
      focusLessonId = nextLesson.id;
      goals.push({
        id: "restart-streak",
        title: nextLesson.title,
        detail: `${nextLesson.durationMinutes} min · reative sua ofensiva hoje`,
        type: "lesson",
        priority: "high",
        estimatedMinutes: nextLesson.durationMinutes,
        lessonId: nextLesson.id,
        subjectId: nextLesson.subjectId,
        topic: nextLesson.topic,
      });
    }
  } else if (weakTopicsDetailed.length >= 2 && weakTopicsDetailed[0].accuracy < 0.6) {
    // Tem pontos fracos claros
    tone = "corrective";
    mascotMood = "serious";
    const weakest = weakTopicsDetailed[0];
    headline = "Vamos fortalecer sua base";
    body = `Identifiquei ${weakTopicsDetailed.length} temas com desempenho abaixo do ideal. Hoje focamos no mais crítico: ${weakest.topic} (${Math.round(weakest.accuracy * 100)}% de acerto).`;
    suggestedAction = "review_weak";
    focusTopic = weakest.topic;
    focusSubjectId = weakest.subjectId;

    goals.push({
      id: "fix-weak-1",
      title: `Reforço: ${weakest.topic}`,
      detail: `Precisão atual ${Math.round(weakest.accuracy * 100)}% · revisão ativa + questões`,
      type: "review",
      priority: "high",
      estimatedMinutes: 18,
      subjectId: weakest.subjectId,
      topic: weakest.topic,
    });

    if (nextLesson) {
      focusLessonId = nextLesson.id;
      goals.push({
        id: "advance-lesson",
        title: nextLesson.title,
        detail: "Avance no mapa tático depois do reforço",
        type: "lesson",
        priority: "medium",
        estimatedMinutes: nextLesson.durationMinutes,
        lessonId: nextLesson.id,
        subjectId: nextLesson.subjectId,
        topic: nextLesson.topic,
      });
    }
  } else if (state.streak >= 7 && state.streak % 7 === 0) {
    // Celebração de ofensiva
    tone = "celebratory";
    mascotMood = "proud";
    headline = `${state.streak} dias de ofensiva!`;
    body = rankProgress.nextTitle
      ? `Patente atual: ${rankProgress.currentTitle}. Faltam ${rankProgress.pointsToNext.toLocaleString("pt-BR")} PT para ${rankProgress.nextTitle}. Continue no ritmo.`
      : `Patente atual: ${rankProgress.currentTitle}. Você está no topo da carreira tática. Mantenha a excelência.`;
    suggestedAction = "study_lesson";

    if (nextLesson) {
      focusSubjectId = nextLesson.subjectId;
      focusTopic = nextLesson.topic;
      focusLessonId = nextLesson.id;
      goals.push({
        id: "streak-reward-lesson",
        title: nextLesson.title,
        detail: "Missão do dia · mantenha a sequência",
        type: "lesson",
        priority: "high",
        estimatedMinutes: nextLesson.durationMinutes,
        lessonId: nextLesson.id,
        subjectId: nextLesson.subjectId,
        topic: nextLesson.topic,
      });
    }
  } else {
    // Fluxo normal de progresso
    tone = "motivational";
    mascotMood = "encouraging";
    headline = `Missão do dia · ${rankProgress.currentTitle}`;
    body = nextLesson
      ? `Hoje avançamos em ${nextLesson.topic}. Foque com atenção total por ${nextLesson.durationMinutes} minutos. ${rankProgress.nextTitle ? `Faltam ${rankProgress.pointsToNext.toLocaleString("pt-BR")} PT para ${rankProgress.nextTitle}.` : ""}`
      : "Você está em dia com as lições disponíveis. Revise os temas críticos ou faça um simulado para consolidar.";
    suggestedAction = nextLesson ? "study_lesson" : "review_weak";

    if (nextLesson) {
      focusSubjectId = nextLesson.subjectId;
      focusTopic = nextLesson.topic;
      focusLessonId = nextLesson.id;
      goals.push({
        id: "daily-mission",
        title: nextLesson.title,
        detail: `${nextLesson.durationMinutes} min + questões de fixação`,
        type: "lesson",
        priority: "high",
        estimatedMinutes: nextLesson.durationMinutes,
        lessonId: nextLesson.id,
        subjectId: nextLesson.subjectId,
        topic: nextLesson.topic,
      });
    }

    if (weakTopicsDetailed.length > 0 && weakTopicsDetailed[0].accuracy < 0.75) {
      const weak = weakTopicsDetailed[0];
      goals.push({
        id: "light-review",
        title: `Revisão rápida: ${weak.topic}`,
        detail: `Precisão ${Math.round(weak.accuracy * 100)}% · mantenha sob controle`,
        type: "review",
        priority: "medium",
        estimatedMinutes: 12,
        subjectId: weak.subjectId,
        topic: weak.topic,
      });
    }
  }

  // Sempre incentivar manutenção de ofensiva se estiver ativa
  if (hasStreak && goals.length > 0 && !goals.some((g) => g.type === "streak")) {
    goals.push({
      id: "keep-streak",
      title: "Manter ofensiva",
      detail: `${state.streak} dias · não quebre a sequência`,
      type: "streak",
      priority: "low",
      estimatedMinutes: 0,
    });
  }

  const estimatedTotalMinutes = goals
    .filter((g) => g.type !== "streak")
    .reduce((sum, g) => sum + g.estimatedMinutes, 0);

  return {
    message: { tone, headline, body, mascotMood },
    goals,
    focusSubjectId,
    focusTopic,
    focusLessonId,
    weakTopics,
    suggestedAction,
    estimatedTotalMinutes,
    rankProgress,
  };
}

/**
 * Texto curto para o mascote falar (pode ser usado em várias telas)
 */
export function getMascotLine(plan: MentorshipPlan): string {
  switch (plan.message.mascotMood) {
    case "proud":
      return "Orgulho da tropa! Continue assim.";
    case "alert":
      return "Foco total. A patente está perto.";
    case "serious":
      return "Disciplina agora. Resultados depois.";
    case "happy":
      return "Bora começar essa jornada juntos!";
    default:
      return "Missão clara. Execute com precisão.";
  }
}
