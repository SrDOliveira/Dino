import { describe, expect, it } from "vitest";
import { THEORY_AREAS, mayUseSource, sourceTierForUrl } from "../lib/theory-source-policy";

describe("política de fontes teóricas", () => {
  it("mantém o mapa de vinte e quatro áreas de estudo", () => {
    expect(THEORY_AREAS).toHaveLength(24);
  });

  it("prioriza fontes primárias e bloqueia fontes desconhecidas sem revisão", () => {
    expect(sourceTierForUrl("https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm")).toBe("primaria");
    expect(mayUseSource("https://blog-nao-verificado.example/material", false)).toBe(false);
    expect(mayUseSource("https://blog-nao-verificado.example/material", true)).toBe(true);
  });
});
