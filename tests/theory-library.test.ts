import { describe, expect, it } from "vitest";
import { THEORY_LIBRARY, findTheoryForTopic } from "../lib/theory-library";

describe("biblioteca teórica", () => {
  it("mantém referências obrigatórias nos conteúdos locais", () => {
    expect(THEORY_LIBRARY.every((article) => article.references.length > 0)).toBe(true);
  });

  it("encontra teoria pelo tema que aparece na missão", () => {
    expect(findTheoryForTopic("matematica", "Frações")?.title).toContain("Frações");
  });
});
