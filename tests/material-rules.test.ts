import { describe, expect, it } from "vitest";

import { canAddPdf, MAX_PDF_BYTES } from "../lib/material-rules";
import { nextProcessingStage } from "../lib/content-models";

describe("regras da biblioteca local", () => {
  it("aceita PDFs de até 50 MB e bloqueia arquivos maiores", () => {
    expect(canAddPdf(MAX_PDF_BYTES)).toBe(true);
    expect(canAddPdf(MAX_PDF_BYTES + 1)).toBe(false);
  });

  it("avança a fila local sem pular o estado final", () => {
    expect(nextProcessingStage("queued")).toBe("reading");
    expect(nextProcessingStage("study-plan")).toBe("ready");
    expect(nextProcessingStage("ready")).toBe("ready");
  });
});
