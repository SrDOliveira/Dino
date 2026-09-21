import { describe, expect, it } from "vitest";
import { calculateLeaguePoints, createLeagueSnapshot } from "../lib/league-data";

describe("liga de estudo local", () => {
  it("valoriza XP, acertos e ofensiva", () => {
    const low = calculateLeaguePoints({ xp: 10, answers: [{ correct: false }], streak: 0 });
    const high = calculateLeaguePoints({ xp: 10, answers: [{ correct: true }, { correct: true }], streak: 3 });
    expect(high).toBeGreaterThan(low);
  });

  it("inclui o candidato na classificação ordenada", () => {
    const snapshot = createLeagueSnapshot({ name: "Ana", xp: 500, answers: [{ correct: true }, { correct: true }], streak: 4 });
    expect(snapshot.entries[0].isCurrentUser).toBe(true);
    expect(snapshot.currentRank).toBe(1);
  });
});
