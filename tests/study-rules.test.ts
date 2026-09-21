import { describe, expect, it } from "vitest";

import { calculateNextStreak, calculateSubjectScore, priorityLabel, summarizeConfidence, xpForAnswer } from "../lib/study-rules";
import { hydrateStudyState, serializeStudyState } from "../lib/study-persistence";

describe("regras de estudo do Dino", () => {
  it("reduz o domínio quando o acerto foi marcado como chute", () => {
    const score = calculateSubjectScore([
      { correct: true, confidence: "know" },
      { correct: true, confidence: "guess" },
      { correct: false, confidence: "dont_know" },
      { correct: true, confidence: "know" },
    ]);
    expect(score).toBe(66);
  });

  it("não gera diagnóstico sem respostas", () => {
    expect(calculateSubjectScore([])).toBeNull();
  });

  it("mantém a ofensiva no mesmo dia e a incrementa no dia seguinte", () => {
    expect(calculateNextStreak(4, "2026-08-25", "2026-08-25", "2026-08-24")).toBe(4);
    expect(calculateNextStreak(4, "2026-08-24", "2026-08-25", "2026-08-24")).toBe(5);
    expect(calculateNextStreak(4, "2026-08-20", "2026-08-25", "2026-08-24")).toBe(1);
  });

  it("atribui XP proporcional ao resultado da questão", () => {
    expect(xpForAnswer(true)).toBe(10);
    expect(xpForAnswer(false)).toBe(3);
  });

  it("separa os sinais de dúvida, chute e erro com confiança", () => {
    const answers = [
      { correct: false, confidence: "dont_know" as const },
      { correct: false, confidence: "know" as const },
      { correct: true, confidence: "guess" as const },
    ];
    expect(summarizeConfidence(answers)).toMatchObject({ unsureWrong: 1, certainWrong: 1, guessedCorrect: 1 });
    expect(priorityLabel(answers)).toBe("Comece pelo conceito-base");
  });

  it("restaura o progresso salvo e preserva valores padrão ausentes", () => {
    const fallback = { xp: 0, streak: 0, name: "" };
    const saved = serializeStudyState({ xp: 23, name: "Lia" });
    expect(hydrateStudyState(saved, fallback)).toEqual({ xp: 23, streak: 0, name: "Lia" });
    expect(hydrateStudyState("{inválido", fallback)).toEqual(fallback);
  });
});
