import { describe, expect, it } from "vitest";
import { deriveApiBaseUrlFromHost } from "../lib/api-url";

describe("endereço da API em dispositivos", () => {
  it("troca a porta do Metro pela API no host do Expo", () => {
    expect(deriveApiBaseUrlFromHost("8081-ambiente.exemplo.com")).toBe("https://3000-ambiente.exemplo.com");
  });

  it("não inventa endereço quando o host não é reconhecido", () => {
    expect(deriveApiBaseUrlFromHost("localhost:8081")).toBe("");
  });
});
