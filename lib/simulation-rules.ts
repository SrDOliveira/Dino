export type SimulationAnswer = { correct: boolean };

export function simulationResult(input: { answers: SimulationAnswer[]; estimatedCutPercent?: number }) {
  const total = input.answers.length;
  const correct = input.answers.filter((answer) => answer.correct).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const cutoff = input.estimatedCutPercent ?? 70;
  return { total, correct, accuracy, cutoff, approved: accuracy >= cutoff };
}

export function simulationMessage(input: { contestTitle: string; accuracy: number; correct: number; total: number; rankTitle: string }) {
  return `No Dino, concluí um simulado tático de ${input.contestTitle}: ${input.correct}/${input.total} acertos (${input.accuracy}%). Patente atual: ${input.rankTitle}.`;
}
