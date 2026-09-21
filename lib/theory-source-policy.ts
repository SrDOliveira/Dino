export type TheoryArea = {
  id: string;
  title: string;
  block: "juridico" | "legislacao" | "geral";
  sourceDomains: string[];
  tacticalFocus: string;
  searchHint: string;
};

export type SourceTier = "primaria" | "institucional" | "complementar" | "bloqueada";

const TRUSTED_DOMAINS: Array<{ domain: string; tier: Exclude<SourceTier, "bloqueada"> }> = [
  { domain: "planalto.gov.br", tier: "primaria" },
  { domain: "legislacao.presidencia.gov.br", tier: "primaria" },
  { domain: "stf.jus.br", tier: "institucional" },
  { domain: "stj.jus.br", tier: "institucional" },
  { domain: "gov.br", tier: "institucional" },
  { domain: "ibge.gov.br", tier: "institucional" },
  { domain: "cert.br", tier: "institucional" },
  { domain: "mec.gov.br", tier: "institucional" },
  { domain: "bn.gov.br", tier: "institucional" },
  { domain: "learn.microsoft.com", tier: "institucional" },
  { domain: "agenciabrasil.ebc.com.br", tier: "institucional" },
  { domain: "al.sp.gov.br", tier: "institucional" },
  { domain: "almg.gov.br", tier: "institucional" },
  { domain: "pactodesanjose.org", tier: "complementar" },
  { domain: "declaracao1948.com.br", tier: "complementar" },
];

export const THEORY_AREAS: TheoryArea[] = [
  { id: "constitucional-geral", title: "Direito Constitucional Geral", block: "juridico", sourceDomains: ["planalto.gov.br"], tacticalFocus: "Princípios fundamentais, direitos e garantias, nacionalidade, direitos políticos e administração pública.", searchHint: "Constituição Federal arts. 1 a 5, 12 a 17 e 37 a 41" },
  { id: "seguranca-publica", title: "Direito Constitucional da Segurança Pública", block: "juridico", sourceDomains: ["planalto.gov.br"], tacticalFocus: "Competências constitucionais dos órgãos de segurança e subordinação funcional.", searchHint: "Constituição Federal arts. 142, 143 e 144" },
  { id: "penal-parte-geral", title: "Direito Penal: Parte Geral", block: "juridico", sourceDomains: ["planalto.gov.br"], tacticalFocus: "Lei penal no tempo e espaço, imputabilidade, concurso de pessoas e excludentes.", searchHint: "Código Penal arts. 1 a 120" },
  { id: "penal-pessoa-patrimonio", title: "Direito Penal: Crimes Contra a Pessoa e Patrimônio", block: "juridico", sourceDomains: ["planalto.gov.br"], tacticalFocus: "Homicídio, furto, roubo, estelionato e apropriação indébita.", searchHint: "Código Penal arts. 121 a 180" },
  { id: "penal-administracao", title: "Crimes Contra a Administração Pública", block: "juridico", sourceDomains: ["planalto.gov.br"], tacticalFocus: "Verbos nucleares de peculato, concussão, corrupção passiva, prevaricação e crimes contra a Administração.", searchHint: "Código Penal arts. 312 a 359-H" },
  { id: "processual-investigacao", title: "Processual Penal: Investigação", block: "juridico", sourceDomains: ["planalto.gov.br"], tacticalFocus: "Características e fases do inquérito policial.", searchHint: "Código de Processo Penal arts. 4 a 23" },
  { id: "processual-prisoes", title: "Processual Penal: Prisões", block: "juridico", sourceDomains: ["planalto.gov.br"], tacticalFocus: "Flagrante, cautelares e audiência de custódia.", searchHint: "Código de Processo Penal arts. 282 a 350" },
  { id: "administrativo-principios", title: "Direito Administrativo: Princípios e Organização", block: "juridico", sourceDomains: ["planalto.gov.br", "stf.jus.br", "stj.jus.br"], tacticalFocus: "LIMPE e administração direta e indireta.", searchHint: "Constituição Federal art. 37 e jurisprudência consolidada" },
  { id: "administrativo-atos", title: "Direito Administrativo: Atos e Poderes", block: "juridico", sourceDomains: ["gov.br", "stf.jus.br", "stj.jus.br"], tacticalFocus: "Atributos dos atos e poderes administrativos.", searchHint: "ato administrativo PATI e poder de polícia" },
  { id: "direitos-humanos", title: "Direitos Humanos", block: "juridico", sourceDomains: ["pactodesanjose.org", "declaracao1948.com.br", "gov.br"], tacticalFocus: "Proteção contra tortura, pessoas presas e uso diferenciado da força.", searchHint: "Convenção Americana de Direitos Humanos e Declaração Universal" },
  { id: "drogas-desarmamento", title: "Drogas e Desarmamento", block: "legislacao", sourceDomains: ["planalto.gov.br"], tacticalFocus: "Art. 28 versus art. 33 e porte versus posse de arma.", searchHint: "Lei 11.343 2006 e Lei 10.826 2003" },
  { id: "hediondos-abuso", title: "Crimes Hediondos e Abuso de Autoridade", block: "legislacao", sourceDomains: ["planalto.gov.br"], tacticalFocus: "Rol de hediondos e dolo específico do abuso de autoridade.", searchHint: "Lei 8.072 1990 e Lei 13.869 2019" },
  { id: "maria-penha-eca", title: "Maria da Penha e ECA", block: "legislacao", sourceDomains: ["planalto.gov.br"], tacticalFocus: "Formas de violência, medidas protetivas e atos infracionais.", searchHint: "Lei 11.340 2006 e Lei 8.069 1990" },
  { id: "penal-militar", title: "Direito Penal e Processual Penal Militar", block: "legislacao", sourceDomains: ["planalto.gov.br"], tacticalFocus: "Crimes militares, motim, deserção e abandono de posto.", searchHint: "Código Penal Militar e CPPM" },
  { id: "portugues-gramatica", title: "Língua Portuguesa: Gramática e Sintaxe", block: "geral", sourceDomains: ["gov.br"], tacticalFocus: "Crase, regência, concordância e pontuação.", searchHint: "acordo ortográfico e gramática normativa" },
  { id: "portugues-interpretacao", title: "Língua Portuguesa: Interpretação", block: "geral", sourceDomains: ["gov.br", "bn.gov.br"], tacticalFocus: "Tipologia textual, figuras e inferência.", searchHint: "textos jornalísticos e dissertativos oficiais" },
  { id: "matematica-basica", title: "Matemática Básica e Proporcionalidade", block: "geral", sourceDomains: ["mec.gov.br"], tacticalFocus: "Frações, MMC, MDC, proporção, regra de três e porcentagem.", searchHint: "parâmetros curriculares matemática básica" },
  { id: "geometria-algebra", title: "Geometria e Álgebra Básica", block: "geral", sourceDomains: ["mec.gov.br"], tacticalFocus: "Equações, Pitágoras, áreas, perímetros e volumes.", searchHint: "geometria álgebra objetos educacionais MEC" },
  { id: "logico", title: "Raciocínio Lógico-Matemático", block: "geral", sourceDomains: ["gov.br"], tacticalFocus: "Conectivos, negações, tabelas-verdade, diagramas e sequências.", searchHint: "lógica proposicional teoria dos conjuntos" },
  { id: "informatica", title: "Informática e Segurança Digital", block: "geral", sourceDomains: ["learn.microsoft.com", "cert.br"], tacticalFocus: "Windows, Excel, nuvem, phishing, ransomware e engenharia social.", searchHint: "Windows Excel segurança internet CERT" },
  { id: "historia", title: "História do Brasil e Geral", block: "geral", sourceDomains: ["bn.gov.br", "mec.gov.br"], tacticalFocus: "Era Vargas, 1932, ditadura, redemocratização e Segunda Guerra.", searchHint: "história brasileira acervos públicos" },
  { id: "geografia", title: "Geografia Geral e do Brasil", block: "geral", sourceDomains: ["ibge.gov.br", "gov.br"], tacticalFocus: "Clima, relevo, biomas, população, urbanização e ambiente.", searchHint: "IBGE geografia Brasil biomas urbanização" },
  { id: "institucional", title: "Legislação Institucional Militar", block: "legislacao", sourceDomains: ["al.sp.gov.br", "almg.gov.br", "gov.br"], tacticalFocus: "Hierarquia, disciplina, transgressões e processos administrativos.", searchHint: "regulamento disciplinar militar estadual" },
  { id: "atualidades", title: "Atualidades e Conhecimentos Gerais", block: "geral", sourceDomains: ["agenciabrasil.ebc.com.br", "gov.br"], tacticalFocus: "Fatos nacionais e internacionais relevantes aos seis a doze meses anteriores à prova.", searchHint: "atualidades segurança pública economia geopolítica" },
];

export function sourceTierForUrl(url: string): SourceTier {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    const match = TRUSTED_DOMAINS.find(({ domain }) => hostname === domain || hostname.endsWith(`.${domain}`));
    return match?.tier ?? "bloqueada";
  } catch {
    return "bloqueada";
  }
}

export function mayUseSource(url: string, editoriallyReviewed: boolean) {
  const tier = sourceTierForUrl(url);
  return tier !== "bloqueada" || editoriallyReviewed;
}

export function sourceMatchesArea(url: string, area: TheoryArea) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return area.sourceDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}
