import { describe, expect, it } from "vitest";
import { parseMaterialAnalysis } from "../server/material-analysis";

describe("resultado estruturado de análise de material", () => {
  it("normaliza os campos utilizados pela biblioteca e preserva a referência", () => {
    const result = parseMaterialAnalysis(JSON.stringify({ summary: "Resumo", studyFocus: ["Tema 1"], theory: "Teoria", questionIdeas: ["Questão 1"], reference: "Apostila, p. 8" }), "apostila.pdf");
    expect(result.summary).toBe("Resumo");
    expect(result.studyFocus).toEqual(["Tema 1"]);
    expect(result.reference).toBe("Apostila, p. 8");
  });
});
