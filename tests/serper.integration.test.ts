import { describe, expect, it } from "vitest";

describe("integração de busca externa", () => {
  it("autentica uma consulta leve na API configurada", async () => {
    const apiKey = process.env.SERPER_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": apiKey!, "Content-Type": "application/json" },
      body: JSON.stringify({ q: "concurso Polícia Federal edital", num: 1, gl: "br", hl: "pt-br" }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json() as { organic?: unknown[] };
    expect(Array.isArray(data.organic)).toBe(true);
  }, 20_000);
});
