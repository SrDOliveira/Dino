import { describe, expect, it } from "vitest";
import { isAllowedLeagueText, sanitizeLeagueText } from "../lib/league-safety";
describe("segurança da Liga", () => { it("normaliza mensagens e bloqueia termos incompatíveis", () => { expect(sanitizeLeagueText("  Bom   estudo! ")).toBe("Bom estudo!"); expect(isAllowedLeagueText("Bom estudo para todos!")).toBe(true); expect(isAllowedLeagueText("Você é um idiota")).toBe(false); }); });
