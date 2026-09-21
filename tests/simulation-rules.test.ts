import { describe, expect, it } from "vitest";
import { simulationMessage, simulationResult } from "../lib/simulation-rules";

describe("simulado tático", () => {
  it("calcula o corte e a aprovação pelo resultado do candidato", () => {
    const result = simulationResult({ answers: [{ correct: true }, { correct: true }, { correct: false }, { correct: true }], estimatedCutPercent: 70 });
    expect(result.accuracy).toBe(75);
    expect(result.approved).toBe(true);
  });

  it("monta uma mensagem clara para compartilhar a conquista", () => {
    expect(simulationMessage({ contestTitle: "PMESP — Soldado", correct: 8, total: 10, accuracy: 80, rankTitle: "Cabo" })).toContain("8/10");
  });
});
