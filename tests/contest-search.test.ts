import { describe, expect, it } from "vitest";
import { buildPoliceContestQuery, normalizeExternalSearchResults } from "../server/contest-search";

describe("normalização da busca externa de concursos", () => {
  it("preserva título, URL, trecho e domínio de fontes válidas", () => {
    const results = normalizeExternalSearchResults([{ title: "Edital PM", link: "https://www.exemplo.gov.br/edital", snippet: "Inscrições abertas" }]);
    expect(results).toEqual([{ title: "Edital PM", url: "https://www.exemplo.gov.br/edital", snippet: "Inscrições abertas", source: "exemplo.gov.br" }]);
  });

  it("qualifica consultas para a descoberta de concursos policiais", () => {
    expect(buildPoliceContestQuery("PMESP Soldado")).toContain("concurso policial edital cargo datas");
  });
});
