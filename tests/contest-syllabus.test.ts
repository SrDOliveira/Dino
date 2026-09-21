import { describe, expect, it } from "vitest";
import { buildCatalogSyllabus, detectSyllabusSubjects, detectSyllabusTopics, syllabusProgress } from "../lib/contest-syllabus";

describe("edital estruturado", () => {
  it("detecta disciplinas e tópicos mencionados no conteúdo programático", () => {
    expect(detectSyllabusSubjects("Língua Portuguesa: conectivos e crase. Informática: segurança da informação.")).toEqual(expect.arrayContaining(["portugues", "informatica"]));
    expect(detectSyllabusTopics("Conectivos, crase e interpretação de textos", "portugues")).toContain("Conectivos");
  });
  it("calcula avanço por tópicos do edital", () => {
    const syllabus = buildCatalogSyllabus("Concurso teste", ["portugues"], [], "Conectivos e crase");
    expect(syllabusProgress(syllabus, ["portugues::Conectivos"]).percent).toBe(100);
  });
});
