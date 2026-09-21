import { describe, expect, it } from "vitest";
import { isPublishableExternalQuestion, shouldApplyContentDelta } from "../lib/content-sync-contracts";

describe("contratos de sincronização editorial", () => {
  it("aplica somente uma versão de conteúdo nova", () => {
    expect(shouldApplyContentDelta("1.0.4", "1.0.5")).toBe(true);
    expect(shouldApplyContentDelta("1.0.4", "1.0.4")).toBe(false);
  });

  it("aceita apenas questões aprovadas e completas", () => {
    expect(isPublishableExternalQuestion({ externalId: "q1", contestId: "pmesp-soldado", discipline: "portugues", topic: "Concordância", stem: "Teste", alternatives: ["A", "B", "C", "D"], correctIndex: 1, explanation: "Explicação", sourceLabel: "VUNESP", status: "publicado", contentVersion: "1.0.5", updatedAt: "2026-08-25T00:00:00.000Z" })).toBe(true);
  });
});
