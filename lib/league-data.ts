export type LeagueEntry = {
  id: string;
  name: string;
  points: number;
  accuracy: number;
  studyMinutes: number;
  isCurrentUser?: boolean;
};

export type LeagueSnapshot = {
  leagueName: string;
  weekLabel: string;
  entries: LeagueEntry[];
  currentRank: number;
  promotionCutoff: number;
};

const sampleEntries: LeagueEntry[] = [
  { id: "bruno", name: "Bruno A.", points: 440, accuracy: 82, studyMinutes: 156 },
  { id: "camila", name: "Camila R.", points: 385, accuracy: 79, studyMinutes: 141 },
  { id: "rafa", name: "Rafa M.", points: 340, accuracy: 76, studyMinutes: 118 },
  { id: "luiza", name: "Luiza P.", points: 270, accuracy: 73, studyMinutes: 95 },
  { id: "vitor", name: "Vitor S.", points: 205, accuracy: 69, studyMinutes: 81 },
  { id: "marina", name: "Marina L.", points: 150, accuracy: 64, studyMinutes: 63 },
];

export function calculateLeaguePoints(input: { xp: number; answers: Array<{ correct: boolean }>; streak: number }) {
  const accuracy = input.answers.length
    ? Math.round((input.answers.filter((answer) => answer.correct).length / input.answers.length) * 100)
    : 0;
  return Math.max(0, input.xp + Math.round(accuracy * 1.2) + input.streak * 4);
}

export function createLeagueSnapshot(input: { name: string; xp: number; answers: Array<{ correct: boolean }>; streak: number }): LeagueSnapshot {
  const accuracy = input.answers.length
    ? Math.round((input.answers.filter((answer) => answer.correct).length / input.answers.length) * 100)
    : 0;
  const candidate: LeagueEntry = {
    id: "candidate-local",
    name: input.name || "Você",
    points: calculateLeaguePoints(input),
    accuracy,
    studyMinutes: Math.max(0, Math.round(input.answers.length * 4.5 + input.streak * 3)),
    isCurrentUser: true,
  };
  const entries = [...sampleEntries, candidate].sort((left, right) => right.points - left.points);
  return { leagueName: "Liga Patrulha", weekLabel: "Semana em andamento", entries, currentRank: entries.findIndex((entry) => entry.isCurrentUser) + 1, promotionCutoff: 3 };
}
