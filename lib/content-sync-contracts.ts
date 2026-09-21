export type ExternalQuestionStatus = "revisao_pendente" | "publicado" | "arquivado";

export type StagedQuestionPayload = {
  externalId: string;
  contestId: string;
  discipline: string;
  topic: string;
  stem: string;
  alternatives: string[];
  correctIndex: number;
  explanation: string;
  sourceLabel: string;
  examiner?: string;
  status: ExternalQuestionStatus;
  contentVersion: string;
  updatedAt: string;
};

export type ContentVersionResponse = {
  contestId: string;
  contentVersion: string;
  updatedAt: string;
};

export type DeltaContentResponse = ContentVersionResponse & {
  questions: StagedQuestionPayload[];
  deletedQuestionIds: string[];
};

export const CONTENT_SYNC_ENDPOINTS = {
  version: "/conteudo/versao",
  delta: "/conteudo/delta",
} as const;

export function shouldApplyContentDelta(localVersion: string | undefined, remoteVersion: string) {
  return !localVersion || localVersion !== remoteVersion;
}

export function isPublishableExternalQuestion(question: StagedQuestionPayload) {
  return question.status === "publicado" && question.alternatives.length >= 4 && question.correctIndex >= 0 && question.correctIndex < question.alternatives.length && Boolean(question.stem.trim()) && Boolean(question.explanation.trim());
}
