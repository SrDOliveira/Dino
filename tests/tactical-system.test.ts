import { describe, expect, it } from "vitest";
import { getRankForPoints, getTacticalBriefs, tacticalPointsForAnswer } from "../lib/tactical-system";

describe("sistema de patentes e brevês", () => {
  it("usa 15 níveis e preserva a patente máxima para a maior faixa de PT", () => {
    expect(getRankForPoints(0).title).toBe("Soldado 2ª Classe");
    expect(getRankForPoints(20_001).title).toBe("Aluno Oficial");
    expect(getRankForPoints(300_001).title).toBe("Coronel (Comandante)");
  });

  it("premia acerto de primeira tentativa e velocidade", () => {
    expect(tacticalPointsForAnswer({ correct: true, firstAttempt: true, durationSeconds: 95 })).toBe(20);
    expect(tacticalPointsForAnswer({ correct: false, firstAttempt: true, durationSeconds: 60 })).toBe(0);
  });

  it("marca um brevê de prontidão para manutenção após revisão crítica atrasada", () => {
    const briefs = getTacticalBriefs({ attempts: Array.from({ length: 25 }, () => ({ correct: true, critical: true, topic: "Frações", answeredAt: "2026-08-01T00:00:00.000Z" })), completedTopics: [], streak: 0, criticalTopics: ["Frações"], now: new Date("2026-08-25T00:00:00.000Z") });
    expect(briefs.find((brief) => brief.id === "atirador-precisao")?.status).toBe("maintenance");
  });
});
