/** Moderação leve de texto da comunidade / liga */

const BLOCKED_TERMS = [
  "idiota",
  "burro",
  "otario",
  "otário",
  "racista",
  "nazi",
  "porno",
  "pornô",
  "pornografia",
  "sexo",
  "drogas",
  "maconha",
  "cocaína",
  "cocaina",
  "arma de fogo",
  "nude",
  "nudes",
  "pelado",
  "pelada",
  "onlyfans",
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeLeagueText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 500);
}

export function sanitizePostText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 800);
}

export function isAllowedLeagueText(value: string) {
  const normalized = normalize(sanitizeLeagueText(value));
  return normalized.length >= 1 && !BLOCKED_TERMS.some((term) => normalized.includes(normalize(term)));
}

export function isAllowedPostText(value: string) {
  const normalized = normalize(sanitizePostText(value));
  if (normalized.length < 1) return false;
  return !BLOCKED_TERMS.some((term) => normalized.includes(normalize(term)));
}

/** Limites de imagem no cliente (moderação básica antes do servidor) */
export const COMMUNITY_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const COMMUNITY_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const;

export function isAllowedCommunityImage(input: { size?: number | null; mimeType?: string | null }) {
  if (input.size != null && input.size > COMMUNITY_IMAGE_MAX_BYTES) {
    return { ok: false as const, reason: "A foto deve ter no máximo 5 MB." };
  }
  if (input.mimeType) {
    const mime = input.mimeType.toLowerCase();
    if (!COMMUNITY_IMAGE_TYPES.some((t) => mime.includes(t.replace("image/", ""))) && !mime.startsWith("image/")) {
      return { ok: false as const, reason: "Envie apenas imagens (JPG, PNG ou WEBP)." };
    }
  }
  return { ok: true as const };
}
