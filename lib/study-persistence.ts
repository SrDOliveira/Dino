export function serializeStudyState<T>(state: T) {
  return JSON.stringify(state);
}

export function hydrateStudyState<T extends object>(stored: string | null, fallback: T): T {
  if (!stored) return fallback;
  try {
    const parsed = JSON.parse(stored) as Partial<T>;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}
