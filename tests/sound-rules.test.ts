import { describe, expect, it } from "vitest";
import { isCustomSoundDurationAllowed } from "../lib/sound-rules";

describe("regra de duração para som próprio", () => {
  it("aceita sons de um a dois segundos", () => {
    expect(isCustomSoundDurationAllowed(1)).toBe(true);
    expect(isCustomSoundDurationAllowed(1.5)).toBe(true);
    expect(isCustomSoundDurationAllowed(2)).toBe(true);
  });

  it("recusa sons fora da faixa", () => {
    expect(isCustomSoundDurationAllowed(0.99)).toBe(false);
    expect(isCustomSoundDurationAllowed(2.01)).toBe(false);
  });
});
