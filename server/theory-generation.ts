import { TheoryArticle, TheoryReference } from "../lib/content-models";
import { THEORY_AREAS, TheoryArea, mayUseSource, sourceMatchesArea, sourceTierForUrl } from "../lib/theory-source-policy";
import { invokeLLM } from "./_core/llm";
import { ExternalSearchResult } from "./contest-search";
import { notifyOwner } from "./_core/notification";

export type TheoryGenerationResult = {
  status: "ready" | "awaiting_editorial_review";
  area: Pick<TheoryArea, "id" | "title" | "tacticalFocus">;
  sources: ExternalSearchResult[];
  article?: TheoryArticle;
  message?: string;
};

const SUBJECT_AREA: Record<string, string> = {
  constitucional: "constitucional-geral",
  administrativo: "administrativo-principios",
  penal: "penal-parte-geral",
  "processo-penal": "processual-investigacao",
  portugues: "portugues-gramatica",
  logica: "logico",
  informatica: "informatica",
  matematica: "matematica-basica",
  historia: "historia",
  geografia: "geografia",
  atualidades: "atualidades",
};

function normalized(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function resolveTheoryArea(subjectId: string, topic: string) {
  const readableTopic = normalized(topic);
  if (subjectId === "constitucional" && readableTopic.includes("seguranca")) return THEORY_AREAS.find((area) => area.id === "seguranca-publica")!;
  if (subjectId === "penal" && readableTopic.includes("administracao")) return THEORY_AREAS.find((area) => area.id === "penal-administracao")!;
  if (subjectId === "processo-penal" && readableTopic.includes("pris")) return THEORY_AREAS.find((area) => area.id === "processual-prisoes")!;
  if (subjectId === "portugues" && readableTopic.includes("interpret")) return THEORY_AREAS.find((area) => area.id === "portugues-interpretacao")!;
  return THEORY_AREAS.find((area) => area.id === SUBJECT_AREA[subjectId]) ?? {
    id: "conteudo-especifico",
    title: "Conteúdo específico do concurso",
    block: "geral" as const,
    sourceDomains: ["gov.br"],
    tacticalFocus: `Conteúdo específico de ${topic}.`,
    searchHint: topic,
  };
}

export function buildTheorySearchQuery(area: TheoryArea, topic: string, contestTitle?: string) {
  const contestContext = contestTitle?.trim() ? ` ${contestTitle.trim()}` : "";
  return `${topic} ${area.searchHint}${contestContext}`.slice(0, 220);
}

export function selectTheorySources(results: ExternalSearchResult[], area: TheoryArea) {
  const permitted = results.filter((result) => mayUseSource(result.url, false));
  return permitted
    .sort((a, b) => Number(sourceMatchesArea(b.url, area)) - Number(sourceMatchesArea(a.url, area)))
    .slice(0, 4);
}

function valueOr(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function listOr(value: unknown, fallback: string[]) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 4) : fallback;
}

function sectionsOr(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    const heading = valueOr(record.heading, "");
    const body = valueOr(record.body, "");
    return heading && body ? [{ heading, body }] : [];
  }).slice(0, 6);
}

export async function generateTheoryFromSources(input: { subjectId: string; topic: string; contestTitle?: string; area: TheoryArea; sources: ExternalSearchResult[] }): Promise<TheoryGenerationResult> {
  const sources = selectTheorySources(input.sources, input.area);
  const area = { id: input.area.id, title: input.area.title, tacticalFocus: input.area.tacticalFocus };
  if (!sources.length) {
    await notifyOwner({ title: "Teoria pendente no Dino", content: `O tema “${input.topic}” (${input.subjectId}) não encontrou fontes permitidas e precisa de curadoria editorial.` }).catch(() => false);
    return { status: "awaiting_editorial_review", area, sources: [], message: "Nenhuma fonte permitida foi localizada. A gestão editorial foi avisada e você pode enviar seu próprio material enquanto o tema é revisado." };
  }

  const sourceBrief = sources.map((source, index) => `${index + 1}. ${source.title}\nURL: ${source.url}\nTrecho: ${source.snippet}`).join("\n\n");
  const response = await invokeLLM({
    model: "gemini-3-flash-preview",
    maxTokens: 3200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Você é um revisor pedagógico para concursos policiais brasileiros. Produza uma leitura aprofundada e didática, organizada em 4 a 6 módulos, baseada exclusivamente nos trechos e URLs autorizados fornecidos. Não invente leis, artigos, datas, decisões, exceções, exemplos factuais ou fontes. Se os trechos não sustentarem uma afirmação, omita-a. Não reproduza texto extenso de terceiros. Cada módulo deve explicar o conceito, o raciocínio de prova e como revisar. Retorne JSON com title, tacticalFocus, summary, sections (array de {heading, body}) e keyTakeaways (array de strings)." },
      { role: "user", content: `Concurso: ${input.contestTitle ?? "não informado"}\nTema solicitado: ${input.topic}\nFoco tático: ${input.area.tacticalFocus}\n\nFontes autorizadas:\n${sourceBrief}` },
    ],
  });
  const raw = response.choices[0]?.message.content;
  if (typeof raw !== "string") throw new Error("A geração de teoria não retornou conteúdo textual.");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const sections = sectionsOr(parsed.sections);
  if (!sections.length) throw new Error("A teoria retornada não contém seções de estudo válidas.");
  const references: TheoryReference[] = sources.map((source) => ({ title: source.title, url: source.url, sourceTier: sourceTierForUrl(source.url) as TheoryReference["sourceTier"], accessedAt: new Date().toISOString().slice(0, 10) }));
  return { status: "ready", area, sources, article: { id: `web-${input.subjectId}-${Date.now()}`, areaId: input.area.id, subjectId: input.subjectId, topic: input.topic, title: valueOr(parsed.title, input.topic), tacticalFocus: valueOr(parsed.tacticalFocus, input.area.tacticalFocus), readingMinutes: Math.max(10, sections.length * 3), reviewStatus: "gerado_com_fontes", summary: valueOr(parsed.summary, "Leitura aprofundada disponível com referências verificáveis."), sections, keyTakeaways: listOr(parsed.keyTakeaways, ["Revise as referências antes de aprofundar o tema."]), references, updatedAt: new Date().toISOString().slice(0, 10) } };
}
