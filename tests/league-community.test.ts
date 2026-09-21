import { describe, expect, it } from "vitest";
import { isAllowedLeagueText } from "../lib/league-safety";

describe("regras da comunidade", () => {
  it("preserva conversas de estudo e rejeita conteúdo proibido", () => {
    expect(isAllowedLeagueText("Alguém revisou direito constitucional hoje?")).toBe(true);
    expect(isAllowedLeagueText("conteúdo pornô")).toBe(false);
  });
});
