import { describe, expect, it } from "vitest";
import { buildTacticalMissions, getBadges, getTacticalRank } from "../lib/tactical-progress";

describe("progresso tático", () => {
  it("promove a patente conforme os brevês conquistados", () => {
    expect(getTacticalRank(0).title).toBe("Soldado");
    expect(getTacticalRank(3).title).toBe("Cabo");
    expect(getTacticalRank(20).title).toBe("Comandante");
  });

  it("conquista brevês por prática, acertos e consistência", () => {
    const badges = getBadges({ xp: 70, streak: 7, completedLessonIds: ["licao-conectivos", "licao-direitos", "licao-principios", "licao-proposicoes"], answers: Array.from({ length: 6 }, () => ({ correct: true, confidence: "know" as const, subjectId: "portugues", topic: "Conectivos" })) });
    expect(badges.filter((badge) => badge.unlocked)).toHaveLength(5);
  });

  it("deixa a próxima lição disponível e mantém o restante do mapa bloqueado", () => {
    const missions = buildTacticalMissions(["portugues", "constitucional"], ["licao-conectivos"]);
    expect(missions.find((mission) => mission.id === "licao-conectivos")?.status).toBe("completed");
    expect(missions.find((mission) => mission.id === "licao-direitos")?.status).toBe("active");
  });

  it("prioriza as missões semanais escolhidas pelo candidato", () => {
    const missions = buildTacticalMissions(["portugues", "constitucional"], [], ["licao-direitos"]);
    expect(missions.find((mission) => mission.id === "licao-direitos")?.status).toBe("active");
    expect(missions.find((mission) => mission.id === "licao-conectivos")?.status).toBe("locked");
  });
});
