import { describe, expect, it } from "vitest";

import { getLocalPoliceContest, searchLocalPoliceContests } from "../lib/contest-catalog";

describe("catálogo local de concursos policiais", () => {
  it("encontra concursos por sigla e por nomes com acento", () => {
    expect(searchLocalPoliceContests("PF")).toHaveLength(2);
    expect(searchLocalPoliceContests("policia militar sao paulo")[0].id).toBe("pmesp-soldado");
  });

  it("preserva uma confirmação segura quando o identificador não existir", () => {
    expect(getLocalPoliceContest("inexistente").id).toBe("pf-agente");
  });
});
