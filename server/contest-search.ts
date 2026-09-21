export type ExternalSearchResult = {
  title: string;
  url: string;
  snippet: string;
  source: string;
};

type SerperOrganicResult = { title?: string; link?: string; snippet?: string };

export function normalizeExternalSearchResults(organic: SerperOrganicResult[] = []): ExternalSearchResult[] {
  return organic
    .filter((result): result is Required<Pick<SerperOrganicResult, "title" | "link">> & SerperOrganicResult => Boolean(result.title && result.link))
    .slice(0, 8)
    .map((result) => {
      let source = "Fonte pública";
      try { source = new URL(result.link).hostname.replace(/^www\./, ""); } catch { /* URL é exibida como recebida. */ }
      return { title: result.title, url: result.link, snippet: result.snippet ?? "Sem trecho disponível.", source };
    });
}

export function buildPoliceContestQuery(query: string) {
  return `${query.trim()} concurso edital cargo datas polícia OR "guarda municipal" OR exército OR marinha OR aeronáutica`;
}
