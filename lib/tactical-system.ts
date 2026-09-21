export type TacticalRankDefinition = {
  level: number;
  title: string;
  minPoints: number;
  maxPoints?: number;
  milestone: string;
};

export type TacticalAttempt = {
  correct: boolean;
  firstAttempt?: boolean;
  durationSeconds?: number;
  topic?: string;
  subjectId?: string;
  examiner?: string;
  answeredAt?: string;
  critical?: boolean;
};

export type TacticalBrief = {
  id: "artigo-5" | "sentinela-ferro" | "mestre-vunesp" | "padrao-rota" | "atirador-precisao";
  title: string;
  requirement: string;
  status: "locked" | "earned" | "maintenance";
};

export const TACTICAL_RANKS: TacticalRankDefinition[] = [
  { level: 1, title: "Soldado 2ª Classe", minPoints: 0, maxPoints: 300, milestone: "Onboarding e nivelamento" },
  { level: 2, title: "Soldado 1ª Classe", minPoints: 301, maxPoints: 1000, milestone: "Primeira ofensiva cumprida" },
  { level: 3, title: "Cabo", minPoints: 1001, maxPoints: 2500, milestone: "Primeiro ciclo de matérias finalizado" },
  { level: 4, title: "3º Sargento", minPoints: 2501, maxPoints: 5000, milestone: "Cerca de 300 questões resolvidas" },
  { level: 5, title: "2º Sargento", minPoints: 5001, maxPoints: 9000, milestone: "15 dias de ofensiva ininterrupta" },
  { level: 6, title: "1º Sargento", minPoints: 9001, maxPoints: 15000, milestone: "50% do edital batido" },
  { level: 7, title: "Subtenente", minPoints: 15001, maxPoints: 20000, milestone: "Tópicos-base consolidados" },
  { level: 8, title: "Aluno Oficial", minPoints: 20001, maxPoints: 25000, milestone: "Domínio mínimo de 70% nos tópicos-base" },
  { level: 9, title: "2º Tenente", minPoints: 25001, maxPoints: 40000, milestone: "Primeiro simulado completo" },
  { level: 10, title: "1º Tenente", minPoints: 40001, maxPoints: 65000, milestone: "Revisão espaçada em dia por 45 dias" },
  { level: 11, title: "Capitão", minPoints: 65001, maxPoints: 100000, milestone: "Mais de 80% de domínio" },
  { level: 12, title: "Major", minPoints: 100001, maxPoints: 150000, milestone: "Edital 100% batido" },
  { level: 13, title: "Tenente-Coronel", minPoints: 150001, maxPoints: 220000, milestone: "Consistência alta a 30 dias da prova" },
  { level: 14, title: "Coronel", minPoints: 220001, maxPoints: 300000, milestone: "Prontidão avançada e simulados estáveis" },
  { level: 15, title: "Coronel (Comandante)", minPoints: 300001, milestone: "Prontidão total para aprovação" },
];

export function getRankForPoints(points: number) {
  return TACTICAL_RANKS.findLast((rank) => points >= rank.minPoints) ?? TACTICAL_RANKS[0];
}

export function tacticalPointsForAnswer(input: Pick<TacticalAttempt, "correct" | "firstAttempt" | "durationSeconds">) {
  if (!input.correct) return 0;
  const firstAttemptBonus = input.firstAttempt === false ? 0 : 8;
  const speedBonus = input.durationSeconds !== undefined && input.durationSeconds <= 120 ? 2 : 0;
  return 10 + firstAttemptBonus + speedBonus;
}

function ratio(attempts: TacticalAttempt[]) {
  if (!attempts.length) return 0;
  return attempts.filter((attempt) => attempt.correct).length / attempts.length;
}

function daysSince(value?: string, now = new Date()) {
  if (!value) return Number.POSITIVE_INFINITY;
  return Math.floor((now.getTime() - new Date(value).getTime()) / 86_400_000);
}

export function getTacticalBriefs(input: { attempts: TacticalAttempt[]; completedTopics: string[]; streak: number; adaptiveSimulationScore?: number; estimatedCutScore?: number; criticalTopics?: string[]; now?: Date }): TacticalBrief[] {
  const constitutional = input.attempts.filter((attempt) => attempt.subjectId === "constitucional" && attempt.topic === "Direitos fundamentais");
  const vunesp = input.attempts.filter((attempt) => attempt.examiner?.toLowerCase() === "vunesp");
  const critical = input.attempts.filter((attempt) => attempt.critical || input.criticalTopics?.includes(attempt.topic ?? ""));
  const latestByTopic = new Map<string, string>();
  input.attempts.forEach((attempt) => { if (attempt.topic && attempt.answeredAt) latestByTopic.set(attempt.topic, attempt.answeredAt); });
  const staleCriticalTopic = [...latestByTopic.entries()].some(([topic, answeredAt]) => (input.criticalTopics?.includes(topic) ?? false) && daysSince(answeredAt, input.now) > 14);
  const articleFiveEarned = input.completedTopics.includes("Direitos fundamentais") && constitutional.length >= 5 && ratio(constitutional.filter((attempt) => attempt.firstAttempt !== false)) >= 0.85;
  const vunespEarned = vunesp.length >= 100 && ratio(vunesp) >= 0.8 && vunesp.every((attempt) => (attempt.durationSeconds ?? Number.POSITIVE_INFINITY) < 120);
  const rotaEarned = input.adaptiveSimulationScore !== undefined && input.estimatedCutScore !== undefined && input.adaptiveSimulationScore >= input.estimatedCutScore;
  const precisionEarned = critical.length >= 25 && critical.slice(-25).every((attempt) => attempt.correct);
  const withMaintenance = (earned: boolean) => earned && staleCriticalTopic ? "maintenance" as const : earned ? "earned" as const : "locked" as const;
  return [
    { id: "artigo-5", title: "Brevê Tático de Artigo 5º", requirement: "85% na primeira tentativa em Direitos Fundamentais", status: withMaintenance(articleFiveEarned) },
    { id: "sentinela-ferro", title: "Sentinela de Ferro", requirement: "30 dias consecutivos de ofensiva", status: input.streak >= 30 ? "earned" : "locked" },
    { id: "mestre-vunesp", title: "Operações Especiais — Mestre VUNESP", requirement: "100 questões VUNESP, 80% e média abaixo de 2 min", status: withMaintenance(vunespEarned) },
    { id: "padrao-rota", title: "Padrão ROTA", requirement: "Simulado adaptativo acima do corte estimado", status: withMaintenance(rotaEarned) },
    { id: "atirador-precisao", title: "Atirador de Precisão", requirement: "25 acertos seguidos em temas críticos", status: withMaintenance(precisionEarned) },
  ];
}
