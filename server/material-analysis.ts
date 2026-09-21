import { invokeLLM } from "./_core/llm";
import { storageGetSignedUrl, storagePut } from "./storage";

export type MaterialAnalysisResult = {
  summary: string;
  studyFocus: string[];
  theory: string;
  questionIdeas: string[];
  reference: string;
};

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "material.pdf";
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asStringList(value: unknown, fallback: string[]) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 6)
    : fallback;
}

export function parseMaterialAnalysis(raw: string, fileName: string): MaterialAnalysisResult {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  return {
    summary: asString(parsed.summary, "O material foi recebido e precisa de revisão editorial antes do estudo."),
    studyFocus: asStringList(parsed.studyFocus, ["Revise o material enviado antes de iniciar a prática."]),
    theory: asString(parsed.theory, "A teoria resumida estará disponível após a revisão editorial."),
    questionIdeas: asStringList(parsed.questionIdeas, []),
    reference: asString(parsed.reference, `Material enviado pelo candidato: ${fileName}`),
  };
}

export async function analyzeUploadedPdf(input: { materialId: string; fileName: string; bytes: Buffer }) {
  const safeName = sanitizeFileName(input.fileName);
  const stored = await storagePut(`dino-materials/${input.materialId}-${safeName}`, input.bytes, "application/pdf");
  const signedUrl = await storageGetSignedUrl(stored.key);
  const response = await invokeLLM({
    model: "gemini-3-flash-preview",
    max_tokens: 3000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Você é um revisor pedagógico para concursos policiais brasileiros. Leia exclusivamente o PDF enviado. Não invente fatos, páginas, leis, datas ou fontes. Produza teoria objetiva e ideias de questões de fixação; todo conteúdo deve permanecer como rascunho para revisão editorial humana. Retorne JSON com as chaves summary, studyFocus, theory, questionIdeas e reference. studyFocus e questionIdeas devem ser arrays de strings. Em reference, cite somente o nome do material enviado e qualquer página quando ela estiver claramente identificada no documento.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Analise o PDF "${safeName}". Priorize os conceitos que podem orientar microlições e questões rápidas.` },
          { type: "file_url", file_url: { url: signedUrl, mime_type: "application/pdf" } },
        ],
      },
    ],
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") throw new Error("A análise de material não retornou conteúdo textual.");
  return { storageUrl: stored.url, analysis: parseMaterialAnalysis(content, safeName) };
}
