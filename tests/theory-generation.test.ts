import { describe, expect, it } from "vitest";
import { buildTheorySearchQuery, resolveTheoryArea, selectTheorySources } from "../server/theory-generation";

describe("geração de teoria com fontes", () => {
  it("mapeia tema constitucional para a área de fontes primárias", () => {
    expect(resolveTheoryArea("constitucional", "Direitos fundamentais").id).toBe("constitucional-geral");
  });

  it("descarta resultados fora da política e prioriza o domínio definido pela área", () => {
    const area = resolveTheoryArea("constitucional", "Direitos fundamentais");
    const selected = selectTheorySources([
      { title: "Curso fechado", url: "https://curso-exemplo.com/a", snippet: "texto", source: "curso-exemplo.com" },
      { title: "Decisão", url: "https://www.stf.jus.br/noticia", snippet: "texto", source: "stf.jus.br" },
      { title: "Constituição", url: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm", snippet: "texto", source: "planalto.gov.br" },
    ], area);
    expect(selected).toHaveLength(2);
    expect(selected[0].source).toBe("planalto.gov.br");
  });

  it("inclui a dica pedagógica na busca específica", () => {
    expect(buildTheorySearchQuery(resolveTheoryArea("informatica", "Segurança da informação"), "Segurança da informação")).toContain("CERT");
  });
});
