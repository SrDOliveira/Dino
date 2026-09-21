import { describe, expect, it } from "vitest";
import { studyNavDestinations } from "../lib/study-navigation";

describe("navegação persistente de estudo", () => {
  it("mantém os destinos principais acessíveis em telas completas", () => {
    expect(studyNavDestinations.map((destination) => destination.label)).toEqual(["Arena", "Diagnóstico", "Simulados", "Perfil"]);
  });
});
