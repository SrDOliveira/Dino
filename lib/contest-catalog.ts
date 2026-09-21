/**
 * Catálogo leve de concursos da área de segurança e Forças Armadas.
 * Não tenta ser um banco completo de editais — só pontos de partida.
 * O aluno sempre pode ajustar as matérias no onboarding.
 */

export type ContestCategory =
  | "federal"
  | "civil"
  | "militar"
  | "penal"
  | "guarda"
  | "forcas-armadas";

export type PoliceContest = {
  id: string;
  organization: string;
  role: string;
  title: string;
  state: string;
  category: ContestCategory;
  statusLabel: string;
  dateLabel: string;
  localNotice: string;
  subjectIds: string[];
  keywords: string[];
  sourceUrl?: string;
  sourceLabel?: string;
  isExternal?: boolean;
};

/** Grade típica por família de concurso (ponto de partida, não regra fixa) */
const GRADE = {
  policialJuridica: [
    "portugues",
    "constitucional",
    "administrativo",
    "penal",
    "processo-penal",
    "logica",
    "informatica",
  ],
  pmBasica: [
    "portugues",
    "matematica",
    "constitucional",
    "administrativo",
    "penal",
    "atualidades",
  ],
  pmEsp: [
    "portugues",
    "matematica",
    "constitucional",
    "administrativo",
    "historia",
    "geografia",
  ],
  guarda: [
    "portugues",
    "matematica",
    "constitucional",
    "atualidades",
    "logica",
  ],
  forcasArmadas: [
    "portugues",
    "matematica",
    "historia",
    "geografia",
    "atualidades",
  ],
  administrativa: [
    "portugues",
    "constitucional",
    "administrativo",
    "logica",
    "informatica",
    "gestao-publica",
  ],
} as const;

export const LOCAL_POLICE_CONTESTS: PoliceContest[] = [
  // —— Polícias federais / civis ——
  {
    id: "pf-agente",
    organization: "Polícia Federal",
    role: "Agente de Polícia Federal",
    title: "Polícia Federal — Agente",
    state: "Nacional",
    category: "federal",
    statusLabel: "Acompanhar edital",
    dateLabel: "Datas a confirmar",
    localNotice: "Confirme matérias e cronograma no edital oficial.",
    subjectIds: [...GRADE.policialJuridica],
    keywords: ["pf", "polícia federal", "agente", "federal"],
  },
  {
    id: "prf-policial",
    organization: "Polícia Rodoviária Federal",
    role: "Policial Rodoviário Federal",
    title: "PRF — Policial Rodoviário Federal",
    state: "Nacional",
    category: "federal",
    statusLabel: "Acompanhar edital",
    dateLabel: "Datas a confirmar",
    localNotice: "Ajuste a grade conforme o edital da sua banca.",
    subjectIds: [...GRADE.policialJuridica],
    keywords: ["prf", "polícia rodoviária", "rodoviaria federal", "policial rodoviario"],
  },
  {
    id: "pcdf-agente",
    organization: "Polícia Civil do Distrito Federal",
    role: "Agente de Polícia",
    title: "PCDF — Agente de Polícia",
    state: "Distrito Federal",
    category: "civil",
    statusLabel: "Acompanhar edital",
    dateLabel: "Datas a confirmar",
    localNotice: "Confira o status nos canais oficiais da PCDF.",
    subjectIds: [...GRADE.policialJuridica],
    keywords: ["pcdf", "polícia civil df", "policia civil distrito federal", "agente pcdf"],
  },
  {
    id: "pcsp-escrivao",
    organization: "Polícia Civil de São Paulo",
    role: "Escrivão de Polícia",
    title: "PCSP — Escrivão",
    state: "São Paulo",
    category: "civil",
    statusLabel: "Acompanhar edital",
    dateLabel: "Datas a confirmar",
    localNotice: "Matérias variam por edital — use a grade como ponto de partida.",
    subjectIds: [...GRADE.policialJuridica],
    keywords: ["pcsp", "polícia civil sp", "escrivão", "escrivao"],
  },
  // —— Polícia militar ——
  {
    id: "pmdf-soldado",
    organization: "Polícia Militar do Distrito Federal",
    role: "Soldado",
    title: "PMDF — Soldado",
    state: "Distrito Federal",
    category: "militar",
    statusLabel: "Acompanhar edital",
    dateLabel: "Datas a confirmar",
    localNotice: "Consulte edital e comunicados oficiais da PMDF.",
    subjectIds: [...GRADE.pmBasica],
    keywords: ["pmdf", "polícia militar df", "soldado pmdf"],
  },
  {
    id: "pmesp-soldado",
    organization: "Polícia Militar do Estado de São Paulo",
    role: "Soldado PM de 2ª Classe",
    title: "PMESP — Soldado",
    state: "São Paulo",
    category: "militar",
    statusLabel: "Acompanhar edital",
    dateLabel: "Datas a confirmar",
    localNotice: "Confirme matérias no edital da PMESP / banca.",
    subjectIds: [...GRADE.pmEsp],
    keywords: ["pmesp", "pm sp", "polícia militar são paulo", "soldado pmesp"],
  },
  {
    id: "pmeg-soldado",
    organization: "Polícia Militar do Estado de Goiás",
    role: "Soldado",
    title: "PMGO — Soldado",
    state: "Goiás",
    category: "militar",
    statusLabel: "Acompanhar edital",
    dateLabel: "Datas a confirmar",
    localNotice: "Grade inicial genérica de PM — ajuste ao seu edital.",
    subjectIds: [...GRADE.pmBasica],
    keywords: ["pmgo", "pm goiás", "polícia militar goias", "soldado pmgo"],
  },
  // —— Polícia penal / sistema prisional ——
  {
    id: "pp-agente",
    organization: "Polícia Penal",
    role: "Agente de Polícia Penal",
    title: "Polícia Penal — Agente",
    state: "Nacional / Estadual",
    category: "penal",
    statusLabel: "Acompanhar edital",
    dateLabel: "Datas a confirmar",
    localNotice: "Cada estado publica edital próprio — confira matérias locais.",
    subjectIds: ["portugues", "constitucional", "administrativo", "penal", "atualidades", "logica"],
    keywords: ["polícia penal", "agente penitenciário", "penitenciario", "sistema prisional"],
  },
  // —— Guardas municipais ——
  {
    id: "gm-sp",
    organization: "Guarda Civil Metropolitana",
    role: "Guarda Municipal",
    title: "Guarda Municipal — Modelo geral",
    state: "Municipal",
    category: "guarda",
    statusLabel: "Acompanhar edital",
    dateLabel: "Datas a confirmar",
    localNotice: "Editais municipais mudam muito. Use a busca e ajuste as matérias.",
    subjectIds: [...GRADE.guarda],
    keywords: ["guarda municipal", "guarda civil", "gcm", "guarda civil metropolitana"],
  },
  // —— Forças Armadas ——
  {
    id: "eb-soldado",
    organization: "Exército Brasileiro",
    role: "Soldado / Concurso de admissão",
    title: "Exército Brasileiro — Admissão (modelo)",
    state: "Nacional",
    category: "forcas-armadas",
    statusLabel: "Acompanhar edital",
    dateLabel: "Datas a confirmar",
    localNotice: "Concursos do EB variam (EsPCEx, ESA, etc.). Ajuste a grade ao edital.",
    subjectIds: [...GRADE.forcasArmadas],
    keywords: ["exército", "exercito", "eb", "espcex", "esa", "soldado exército"],
  },
  {
    id: "mb-marinheiro",
    organization: "Marinha do Brasil",
    role: "Aprendiz / Concurso de admissão",
    title: "Marinha do Brasil — Admissão (modelo)",
    state: "Nacional",
    category: "forcas-armadas",
    statusLabel: "Acompanhar edital",
    dateLabel: "Datas a confirmar",
    localNotice: "Confirme disciplinas no edital da Marinha para o cargo desejado.",
    subjectIds: [...GRADE.forcasArmadas],
    keywords: ["marinha", "mb", "colégio naval", "aprendiz-marinheiro"],
  },
  {
    id: "fab-admissao",
    organization: "Força Aérea Brasileira",
    role: "Concurso de admissão",
    title: "FAB — Admissão (modelo)",
    state: "Nacional",
    category: "forcas-armadas",
    statusLabel: "Acompanhar edital",
    dateLabel: "Datas a confirmar",
    localNotice: "Grade modelo — personalize conforme o edital da FAB.",
    subjectIds: [...GRADE.forcasArmadas],
    keywords: ["fab", "aeronáutica", "aeronautica", "força aérea", "eeaar"],
  },
];


function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function searchLocalPoliceContests(query: string) {
  const term = normalize(query);
  if (!term) return LOCAL_POLICE_CONTESTS;
  return LOCAL_POLICE_CONTESTS.filter((contest) =>
    normalize(
      [contest.title, contest.organization, contest.role, contest.state, contest.category, ...contest.keywords].join(
        " ",
      ),
    ).includes(term),
  );
}

/** Sugestões equilibradas na home do onboarding (não só PF) */
export function getSuggestedContests(limit = 8): PoliceContest[] {
  const order: ContestCategory[] = [
    "militar",
    "civil",
    "federal",
    "guarda",
    "forcas-armadas",
    "penal",
  ];
  const picked: PoliceContest[] = [];
  for (const cat of order) {
    const item = LOCAL_POLICE_CONTESTS.find(
      (c) => c.category === cat && !picked.some((p) => p.id === c.id),
    );
    if (item) picked.push(item);
    if (picked.length >= limit) break;
  }
  // completa se faltar
  for (const c of LOCAL_POLICE_CONTESTS) {
    if (picked.length >= limit) break;
    if (!picked.some((p) => p.id === c.id)) picked.push(c);
  }
  return picked;
}

export function getLocalPoliceContest(id?: string) {
  return LOCAL_POLICE_CONTESTS.find((contest) => contest.id === id) ?? LOCAL_POLICE_CONTESTS[0];
}

export function contestFromExternalResult(result: {
  title: string;
  url: string;
  snippet: string;
  source: string;
}): PoliceContest {
  const text = normalize(`${result.title} ${result.snippet}`);

  let base =
    LOCAL_POLICE_CONTESTS.find((c) => c.id === "pmesp-soldado") ?? LOCAL_POLICE_CONTESTS[0];

  if (text.includes("policia federal") || text.includes(" pf")) {
    base = LOCAL_POLICE_CONTESTS.find((c) => c.id === "pf-agente") ?? base;
  } else if (text.includes("prf") || text.includes("rodoviaria")) {
    base = LOCAL_POLICE_CONTESTS.find((c) => c.id === "prf-policial") ?? base;
  } else if (text.includes("policia civil")) {
    base = LOCAL_POLICE_CONTESTS.find((c) => c.id === "pcdf-agente") ?? base;
  } else if (text.includes("policia militar") || text.includes(" pm ")) {
    base = LOCAL_POLICE_CONTESTS.find((c) => c.id === "pmesp-soldado") ?? base;
  } else if (text.includes("guarda")) {
    base = LOCAL_POLICE_CONTESTS.find((c) => c.id === "gm-sp") ?? base;
  } else if (text.includes("exercito") || text.includes("espcex") || text.includes("esa")) {
    base = LOCAL_POLICE_CONTESTS.find((c) => c.id === "eb-soldado") ?? base;
  } else if (text.includes("marinha")) {
    base = LOCAL_POLICE_CONTESTS.find((c) => c.id === "mb-marinheiro") ?? base;
  } else if (text.includes("aeronautica") || text.includes("fab") || text.includes("forca aerea")) {
    base = LOCAL_POLICE_CONTESTS.find((c) => c.id === "fab-admissao") ?? base;
  } else if (text.includes("penal") || text.includes("penitenci")) {
    base = LOCAL_POLICE_CONTESTS.find((c) => c.id === "pp-agente") ?? base;
  }

  return {
    ...base,
    id: `externo-${result.url.replace(/[^a-z0-9]/gi, "").slice(-42)}`,
    title: result.title,
    role: "Cargo e requisitos a confirmar",
    state: "Localidade a confirmar",
    statusLabel: "Confirmação necessária",
    dateLabel: "Consulte a fonte",
    localNotice: result.snippet,
    sourceUrl: result.url,
    sourceLabel: result.source,
    isExternal: true,
  };
}
