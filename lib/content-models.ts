export type MaterialProcessingStage = "queued" | "reading" | "structuring" | "study-plan" | "ready" | "error";
export type EditorialStatus = "draft" | "review" | "published";
export type TheoryReviewStatus = "oficial" | "gerado_com_fontes" | "revisado_editorialmente";

export type TheoryReference = {
  title: string;
  url: string;
  sourceTier: "primaria" | "institucional" | "complementar";
  accessedAt: string;
};

export type TheoryArticle = {
  id: string;
  areaId: string;
  subjectId: string;
  topic: string;
  title: string;
  tacticalFocus: string;
  readingMinutes: number;
  reviewStatus: TheoryReviewStatus;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  keyTakeaways: string[];
  references: TheoryReference[];
  updatedAt: string;
};

export type OfflineTheoryPack = {
  articleIds: string[];
  downloadedAt: string;
  contentVersion: string;
};

export type ProcessableMaterial = {
  id: string;
  name: string;
  uri: string;
  size?: number;
  addedAt: string;
  stage: MaterialProcessingStage;
  progress: number;
  discipline?: string;
  note?: string;
  remoteUrl?: string;
  analysis?: {
    summary: string;
    studyFocus: string[];
    theory: string;
    questionIdeas: string[];
    reference: string;
  };
};

export type EditorialQuestion = {
  id: string;
  stem: string;
  alternatives: string[];
  correctIndex: number;
  explanation: string;
  discipline: string;
  topic: string;
  difficulty: "basic" | "intermediate" | "advanced";
  status: EditorialStatus;
  sourceLabel: string;
};

export const PROCESSING_STAGE_LABEL: Record<MaterialProcessingStage, string> = {
  queued: "Aguardando análise",
  reading: "Enviando material",
  structuring: "Lendo com IA",
  "study-plan": "Organizando teoria e questões",
  ready: "Rascunho pronto para revisão",
  error: "Não foi possível analisar",
};

export function nextProcessingStage(stage: MaterialProcessingStage): MaterialProcessingStage {
  const stages: MaterialProcessingStage[] = ["queued", "reading", "structuring", "study-plan", "ready"];
  return stages[Math.min(stages.indexOf(stage) + 1, stages.length - 1)];
}
