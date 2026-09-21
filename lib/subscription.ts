/**
 * Assinatura Dino — Free vs Pro (sem cobrança real ainda)
 * Gates locais: tempo diário, patentes, PDF, simulados.
 */

export type PlanId = "free" | "pro";

export type SubscriptionState = {
  plan: PlanId;
  /** ISO date when pro started (local mock) */
  proSince?: string;
  /** Whether first-month discount was already "used" in UI */
  firstDiscountUsed: boolean;
  /** Seconds of active study counted today (local) */
  studySecondsToday: number;
  /** YYYY-MM-DD of last study time reset */
  studyDayKey?: string;
};

export const FREE_DAILY_STUDY_SECONDS = 60 * 60; // 1 hora
/** Patente máxima no free (nível do tactical-system) — até Cabo (level 3) */
export const FREE_MAX_RANK_LEVEL = 3;
/** Simulados por dia no free */
export const FREE_DAILY_SIMULATIONS = 1;

export const PRICING = {
  proMonthlyCents: 2490, // R$ 24,90
  firstMonthDiscountPercent: 22,
  get firstMonthCents() {
    return Math.round(this.proMonthlyCents * (1 - this.firstMonthDiscountPercent / 100));
  },
} as const;

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  plan: "free",
  firstDiscountUsed: false,
  studySecondsToday: 0,
};

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Normaliza contador diário se mudou o dia */
export function normalizeStudyDay(state: SubscriptionState, now = new Date()): SubscriptionState {
  const key = todayKey(now);
  if (state.studyDayKey === key) return state;
  return { ...state, studyDayKey: key, studySecondsToday: 0 };
}

export function isPro(state: SubscriptionState): boolean {
  return state.plan === "pro";
}

export function remainingStudySeconds(state: SubscriptionState, now = new Date()): number {
  const normalized = normalizeStudyDay(state, now);
  if (isPro(normalized)) return Number.POSITIVE_INFINITY;
  return Math.max(0, FREE_DAILY_STUDY_SECONDS - normalized.studySecondsToday);
}

export function hasStudyTimeLeft(state: SubscriptionState, now = new Date()): boolean {
  if (isPro(state)) return true;
  return remainingStudySeconds(state, now) > 0;
}

export function canUnlockRankLevel(state: SubscriptionState, level: number): boolean {
  if (isPro(state)) return true;
  return level <= FREE_MAX_RANK_LEVEL;
}

export function canUploadPdf(state: SubscriptionState): boolean {
  return isPro(state);
}

export function canRunUnlimitedSimulations(state: SubscriptionState): boolean {
  return isPro(state);
}

export type PaywallReason =
  | "daily_limit"
  | "rank_locked"
  | "pdf_upload"
  | "simulation_limit"
  | "generic";

export function paywallCopy(reason: PaywallReason): { title: string; body: string } {
  switch (reason) {
    case "daily_limit":
      return {
        title: "Seu tempo de estudo de hoje acabou",
        body: "No plano gratuito você tem 1 hora por dia. No Dino Pro o estudo é ilimitado e a mentoria segue sem freio.",
      };
    case "rank_locked":
      return {
        title: "Patente disponível no Dino Pro",
        body: "No gratuito você evolui até Cabo. Desbloqueie toda a carreira tática e os brevês com o Pro.",
      };
    case "pdf_upload":
      return {
        title: "PDF próprio é recurso Pro",
        body: "Envie o material do seu cursinho e transforme em trilha tática com análise assistida.",
      };
    case "simulation_limit":
      return {
        title: "Simulados ilimitados no Pro",
        body: "No gratuito há limite diário de simulados. No Pro você treina no ritmo da prova sem teto.",
      };
    default:
      return {
        title: "Continue evoluindo com o Dino Pro",
        body: "Tempo ilimitado, patentes completas, PDF próprio e mentoria sem limites.",
      };
  }
}

export const PRO_FEATURES = [
  "Estudo ilimitado todos os dias",
  "Carreira de patentes completa",
  "Upload e análise de PDF próprio",
  "Simulados sem limite diário",
  "Mentoria e metas sem freio",
  "Prioridade no conteúdo do seu concurso",
] as const;
