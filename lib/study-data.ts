import { getLocalPoliceContest } from "./contest-catalog";

export type Confidence = "know" | "guess" | "dont_know";

export type Subject = {
  id: string;
  title: string;
  shortTitle: string;
  color: string;
  topics: string[];
};

export type Contest = {
  id: string;
  title: string;
  subtitle: string;
  subjectIds: string[];
};

export type StudyQuestion = {
  id: string;
  subjectId: string;
  topic: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type Lesson = {
  id: string;
  subjectId: string;
  topic: string;
  title: string;
  durationMinutes: number;
  body: string;
  keyPoint: string;
  questionId: string;
};

export const SUBJECTS: Subject[] = [
  { id: "portugues", title: "Língua Portuguesa", shortTitle: "Português", color: "#7C3AED", topics: ["Conectivos", "Concordância verbal"] },
  { id: "constitucional", title: "Direito Constitucional", shortTitle: "Constitucional", color: "#2563EB", topics: ["Direitos fundamentais", "Funções do Estado"] },
  { id: "administrativo", title: "Direito Administrativo", shortTitle: "Administrativo", color: "#0F9D78", topics: ["Princípios administrativos", "Atos administrativos"] },
  { id: "logica", title: "Raciocínio Lógico", shortTitle: "Raciocínio Lógico", color: "#D97706", topics: ["Proposições", "Argumentos lógicos"] },
  { id: "penal", title: "Direito Penal", shortTitle: "Penal", color: "#D4554B", topics: ["Aplicação da lei penal", "Teoria do crime"] },
  { id: "processo-penal", title: "Processo Penal", shortTitle: "Processo Penal", color: "#C2416C", topics: ["Inquérito policial", "Ação penal"] },
  { id: "informatica", title: "Informática", shortTitle: "Informática", color: "#0E7490", topics: ["Segurança da informação", "Sistemas operacionais"] },
  { id: "gestao-publica", title: "Gestão Pública", shortTitle: "Gestão Pública", color: "#4F46E5", topics: ["Administração pública", "Gestão de pessoas"] },
  { id: "matematica", title: "Matemática", shortTitle: "Matemática", color: "#B45309", topics: ["Porcentagem", "Razão e proporção"] },
  { id: "atualidades", title: "Atualidades", shortTitle: "Atualidades", color: "#4B5563", topics: ["Segurança pública", "Cidadania"] },
  { id: "historia", title: "História", shortTitle: "História", color: "#8B5E34", topics: ["História do Brasil", "Cidadania"] },
  { id: "geografia", title: "Geografia", shortTitle: "Geografia", color: "#2F855A", topics: ["Espaço brasileiro", "Geografia urbana"] },
];

export const CONTESTS: Contest[] = [
  { id: "pf-agente", title: "Polícia Federal — Agente", subtitle: "Trilha demonstrativa para área policial federal", subjectIds: SUBJECTS.map((subject) => subject.id) },
  { id: "prf-policial", title: "Polícia Rodoviária Federal", subtitle: "Trilha demonstrativa para carreira rodoviária federal", subjectIds: SUBJECTS.map((subject) => subject.id) },
  { id: "pm-soldado", title: "Polícia Militar — Soldado", subtitle: "Trilha demonstrativa para carreira policial militar", subjectIds: ["portugues", "constitucional", "logica"] },
];

export const QUESTIONS: StudyQuestion[] = [
  {
    id: "portugues-conectivos", subjectId: "portugues", topic: "Conectivos",
    prompt: "Na frase “O candidato estudou bastante, mas errou a questão”, a palavra “mas” estabelece ideia de:",
    options: ["adição", "oposição", "conclusão", "explicação"], correctIndex: 1,
    explanation: "O conectivo “mas” introduz contraste entre estudar bastante e errar a questão; por isso, estabelece oposição.",
  },
  {
    id: "portugues-concordancia", subjectId: "portugues", topic: "Concordância verbal",
    prompt: "Assinale a alternativa com concordância verbal adequada:",
    options: ["Fazem dois anos que comecei a estudar.", "Houveram muitos recursos.", "Deve haver boas razões para revisar.", "Existiam muita dúvida na turma."], correctIndex: 2,
    explanation: "Em “deve haver”, o verbo haver tem sentido de existir e fica no singular. A locução acompanha essa forma: “deve haver”.",
  },
  {
    id: "constitucional-direitos", subjectId: "constitucional", topic: "Direitos fundamentais",
    prompt: "Sobre os direitos fundamentais, é correto afirmar que:",
    options: ["são sempre absolutos", "podem sofrer limitações conforme a Constituição", "pertencem apenas aos brasileiros natos", "dispensam previsão constitucional"], correctIndex: 1,
    explanation: "Direitos fundamentais têm grande proteção, mas não são ilimitados. A interpretação constitucional pode exigir harmonização entre direitos em conflito.",
  },
  {
    id: "constitucional-funcoes", subjectId: "constitucional", topic: "Funções do Estado",
    prompt: "A separação de Poderes busca principalmente:",
    options: ["concentrar todas as decisões em um órgão", "eliminar mecanismos de controle", "distribuir funções e permitir controles recíprocos", "tornar o Executivo superior aos demais"], correctIndex: 2,
    explanation: "A ideia central é distribuir funções estatais e criar freios e contrapesos, evitando concentração excessiva de poder.",
  },
  {
    id: "administrativo-principios", subjectId: "administrativo", topic: "Princípios administrativos",
    prompt: "Qual conjunto reúne princípios expressamente associados à administração pública na Constituição Federal?",
    options: ["Legalidade, impessoalidade, moralidade, publicidade e eficiência", "Autonomia, soberania, supremacia e liberdade", "Hierarquia, disciplina, oportunidade e conveniência", "Segurança, inovação, economicidade e tecnicidade"], correctIndex: 0,
    explanation: "O conjunto conhecido pela sigla LIMPE reúne legalidade, impessoalidade, moralidade, publicidade e eficiência.",
  },
  {
    id: "administrativo-atos", subjectId: "administrativo", topic: "Atos administrativos",
    prompt: "Quando a Administração retira um ato ilegal do ordenamento, ela está praticando:",
    options: ["revogação", "anulação", "convalidação obrigatória", "delegação"], correctIndex: 1,
    explanation: "A anulação retira atos ilegais. A revogação, por sua vez, recai sobre ato válido que se tornou inconveniente ou inoportuno.",
  },
  {
    id: "logica-proposicoes", subjectId: "logica", topic: "Proposições",
    prompt: "Qual frase é uma proposição lógica?",
    options: ["Feche a porta.", "Que excelente resultado!", "Brasília é a capital do Brasil.", "Você estudará hoje?"], correctIndex: 2,
    explanation: "Uma proposição lógica é uma frase declarativa à qual se pode atribuir valor verdadeiro ou falso. “Brasília é a capital do Brasil” atende a esse critério.",
  },
  {
    id: "logica-argumentos", subjectId: "logica", topic: "Argumentos lógicos",
    prompt: "Se todo policial é servidor público e Ana é policial, então:",
    options: ["Ana pode não ser servidora pública.", "Ana é servidora pública.", "Nenhum servidor público é policial.", "Não é possível concluir nada."], correctIndex: 1,
    explanation: "O argumento aplica uma regra geral a um caso particular: se todos os policiais são servidores públicos e Ana é policial, então Ana é servidora pública.",
  },
  { id: "penal-lei", subjectId: "penal", topic: "Aplicação da lei penal", prompt: "Como regra geral, a lei penal mais gravosa pode retroagir para alcançar fato anterior?", options: ["Sim, sempre.", "Não, salvo previsão constitucional específica.", "Somente após decisão administrativa.", "Sim, se houver denúncia."], correctIndex: 1, explanation: "Como regra, a lei penal não retroage para prejudicar. A análise de cada questão deve observar as exceções previstas no ordenamento." },
  { id: "penal-crime", subjectId: "penal", topic: "Teoria do crime", prompt: "Para organizar a análise de uma conduta típica, a teoria do crime costuma examinar, entre outros pontos:", options: ["Fato típico, ilicitude e culpabilidade.", "Apenas a intenção declarada.", "Somente a existência de dano material.", "A opinião da vítima."], correctIndex: 0, explanation: "Em abordagem introdutória, a análise costuma percorrer fato típico, ilicitude e culpabilidade, conforme a teoria adotada pela doutrina." },
  { id: "processo-inquerito", subjectId: "processo-penal", topic: "Inquérito policial", prompt: "O inquérito policial tem como finalidade principal:", options: ["Aplicar a pena diretamente.", "Apurar infração penal e sua autoria para subsidiar a persecução.", "Substituir o julgamento criminal.", "Impedir a atuação do Ministério Público."], correctIndex: 1, explanation: "O inquérito é uma investigação que reúne elementos sobre materialidade e autoria; ele não substitui o processo judicial." },
  { id: "processo-acao", subjectId: "processo-penal", topic: "Ação penal", prompt: "A ação penal pública, em regra, é proposta por:", options: ["Ministério Público.", "Autoridade policial.", "Juiz de ofício.", "Qualquer testemunha."], correctIndex: 0, explanation: "A titularidade da ação penal pública cabe ao Ministério Público, observadas as modalidades e condições previstas em lei." },
  { id: "informatica-seguranca", subjectId: "informatica", topic: "Segurança da informação", prompt: "Uma senha forte tende a ser mais segura quando:", options: ["É curta e contém o nome do usuário.", "É reutilizada em todos os serviços.", "Combina extensão, caracteres variados e não é compartilhada.", "É anotada em local público."], correctIndex: 2, explanation: "Senhas longas, únicas e variadas reduzem riscos. Também é importante não compartilhá-las e usar recursos adicionais de proteção quando disponíveis." },
  { id: "informatica-sistemas", subjectId: "informatica", topic: "Sistemas operacionais", prompt: "O sistema operacional é responsável, entre outras tarefas, por:", options: ["Gerenciar recursos de hardware e permitir a execução de programas.", "Substituir todo aplicativo do usuário.", "Conectar-se obrigatoriamente à internet.", "Criar documentos sem programas."], correctIndex: 0, explanation: "O sistema operacional gerencia recursos como memória, arquivos e dispositivos, oferecendo serviços para programas e usuários." },
  { id: "gestao-publica-adm", subjectId: "gestao-publica", topic: "Administração pública", prompt: "O planejamento na administração pública ajuda principalmente a:", options: ["Definir objetivos e organizar recursos para alcançá-los.", "Eliminar toda necessidade de controle.", "Substituir a lei por decisões pessoais.", "Evitar qualquer avaliação."], correctIndex: 0, explanation: "Planejamento organiza objetivos, prioridades, recursos e indicadores para orientar a ação pública." },
  { id: "gestao-publica-pessoas", subjectId: "gestao-publica", topic: "Gestão de pessoas", prompt: "Uma prática coerente de gestão de pessoas no setor público é:", options: ["Definir competências e oferecer desenvolvimento contínuo.", "Ignorar regras de seleção e avaliação.", "Evitar qualquer retorno sobre desempenho.", "Manter atribuições indefinidas."], correctIndex: 0, explanation: "O desenvolvimento por competências e o feedback estruturado ajudam a alinhar pessoas, serviço público e resultados." },
  { id: "matematica-porcentagem", subjectId: "matematica", topic: "Porcentagem", prompt: "Uma turma de 80 candidatos teve 25% de aprovação. Quantos foram aprovados?", options: ["15", "20", "25", "40"], correctIndex: 1, explanation: "25% equivale a um quarto. Um quarto de 80 é 20." },
  { id: "matematica-razao", subjectId: "matematica", topic: "Razão e proporção", prompt: "Se 3 cadernos custam R$ 30, mantendo o mesmo preço unitário, 5 cadernos custam:", options: ["R$ 40", "R$ 45", "R$ 50", "R$ 60"], correctIndex: 2, explanation: "Cada caderno custa R$ 10. Portanto, cinco custam R$ 50." },
  { id: "atualidades-seguranca", subjectId: "atualidades", topic: "Segurança pública", prompt: "Uma leitura responsável de dados de segurança pública exige:", options: ["Considerar fonte, período e contexto dos indicadores.", "Usar apenas uma manchete isolada.", "Ignorar diferenças entre regiões.", "Tomar estimativas como dados oficiais."], correctIndex: 0, explanation: "Indicadores precisam ser interpretados com fonte, recorte temporal, metodologia e contexto." },
  { id: "atualidades-cidadania", subjectId: "atualidades", topic: "Cidadania", prompt: "Cidadania envolve, entre outros aspectos:", options: ["Apenas o direito de votar.", "Direitos, deveres e participação na vida coletiva.", "Somente obrigações tributárias.", "Exclusão do debate público."], correctIndex: 1, explanation: "Cidadania reúne direitos civis, políticos e sociais, além de responsabilidades e participação coletiva." },
  { id: "historia-brasil", subjectId: "historia", topic: "História do Brasil", prompt: "O estudo da história do Brasil em concursos busca principalmente:", options: ["Memorizar datas sem contexto.", "Compreender processos, permanências e transformações sociais e políticas.", "Substituir o estudo de atualidades.", "Evitar a análise de fontes."], correctIndex: 1, explanation: "Questões costumam cobrar relações entre processos históricos, contexto, consequências e interpretações." },
  { id: "historia-cidadania", subjectId: "historia", topic: "Cidadania", prompt: "A ampliação da cidadania ao longo da história brasileira pode ser entendida como:", options: ["Processo de disputa e conquista de direitos.", "Fato instantâneo e sem conflitos.", "Tema sem relação com instituições.", "Movimento exclusivo de uma região."], correctIndex: 0, explanation: "A cidadania é resultado de processos sociais e políticos, com disputas por participação e reconhecimento de direitos." },
  { id: "geografia-espaco", subjectId: "geografia", topic: "Espaço brasileiro", prompt: "O território brasileiro apresenta diversidade regional que pode ser analisada por:", options: ["Aspectos naturais, sociais, econômicos e culturais.", "Um único fator climático.", "Apenas limites políticos.", "Somente o tamanho da população."], correctIndex: 0, explanation: "A leitura geográfica integra dimensões naturais e humanas para compreender os diferentes espaços do país." },
  { id: "geografia-urbana", subjectId: "geografia", topic: "Geografia urbana", prompt: "Um desafio frequente das cidades brasileiras é:", options: ["Planejar mobilidade, habitação e acesso a serviços de forma integrada.", "Eliminar toda diferença entre bairros instantaneamente.", "Ignorar o crescimento urbano.", "Separar transporte de uso do solo."], correctIndex: 0, explanation: "Mobilidade, moradia, infraestrutura e serviços públicos são temas interdependentes no planejamento urbano." },
];

export const LESSONS: Lesson[] = [
  {
    id: "licao-conectivos", subjectId: "portugues", topic: "Conectivos", title: "Conectivos: encontre a relação", durationMinutes: 4,
    body: "Conectivos ligam ideias e mostram a relação entre elas. Quando a segunda ideia contrasta com a primeira, procure palavras como mas, porém, contudo e entretanto.",
    keyPoint: "Trocar “mas” por “porém” sem alterar o sentido é um forte sinal de oposição.", questionId: "portugues-conectivos",
  },
  {
    id: "licao-direitos", subjectId: "constitucional", topic: "Direitos fundamentais", title: "Direitos fundamentais na prática", durationMinutes: 5,
    body: "Direitos fundamentais protegem liberdade, igualdade e dignidade. Eles orientam a atuação do Estado, mas devem conviver com outros direitos e regras constitucionais.",
    keyPoint: "Proteção elevada não significa direito sem qualquer limite.", questionId: "constitucional-direitos",
  },
  {
    id: "licao-principios", subjectId: "administrativo", topic: "Princípios administrativos", title: "LIMPE: a base da Administração", durationMinutes: 4,
    body: "A atuação administrativa deve observar legalidade, impessoalidade, moralidade, publicidade e eficiência. Esses princípios dão direção e limite aos agentes públicos.",
    keyPoint: "A sigla LIMPE ajuda a recuperar os cinco princípios expressos no texto constitucional.", questionId: "administrativo-principios",
  },
  {
    id: "licao-proposicoes", subjectId: "logica", topic: "Proposições", title: "Proposições: verdadeiro ou falso", durationMinutes: 3,
    body: "Na lógica, uma proposição é uma frase declarativa que pode ser julgada como verdadeira ou falsa. Perguntas, ordens e exclamações não têm essa característica.",
    keyPoint: "Pergunte: consigo atribuir verdadeiro ou falso a esta frase?", questionId: "logica-proposicoes",
  },
];

export function getSubject(subjectId: string) {
  return SUBJECTS.find((subject) => subject.id === subjectId);
}

export function getContest(contestId?: string) {
  const legacyContest = CONTESTS.find((contest) => contest.id === contestId);
  if (legacyContest) return legacyContest;
  const localContest = getLocalPoliceContest(contestId);
  return { id: localContest.id, title: localContest.title, subtitle: `${localContest.organization} · ${localContest.role}`, subjectIds: localContest.subjectIds } as Contest;
}

export function getQuestion(questionId: string) {
  return QUESTIONS.find((question) => question.id === questionId);
}
