import { Confidence } from "./study-data";

export type ScorableAnswer = {
  correct: boolean;
  confidence: Confidence;
};

export type ConfidenceBreakdown = {
  certainCorrect: number;
  guessedCorrect: number;
  unsureWrong: number;
  certainWrong: number;
};

const confidenceWeight: Record<Confidence, number> = {
  know: 1,
  guess: 0.62,
  dont_know: 0.35,
};

export function calculateSubjectScore(answers: ScorableAnswer[]) {
  if (!answers.length) return null;
  const weightedCorrect = answers.reduce((total, answer) => answer.correct ? total + confidenceWeight[answer.confidence] : total, 0);
  return Math.round((weightedCorrect / answers.length) * 100);
}

export function summarizeConfidence(answers: ScorableAnswer[]): ConfidenceBreakdown {
  return answers.reduce<ConfidenceBreakdown>((summary, answer) => {
    if (answer.correct && answer.confidence === "know") summary.certainCorrect += 1;
    else if (answer.correct) summary.guessedCorrect += 1;
    else if (answer.confidence === "know") summary.certainWrong += 1;
    else summary.unsureWrong += 1;
    return summary;
  }, { certainCorrect: 0, guessedCorrect: 0, unsureWrong: 0, certainWrong: 0 });
}

export function priorityLabel(answers: ScorableAnswer[]) {
  const summary = summarizeConfidence(answers);
  if (summary.unsureWrong > 0) return "Comece pelo conceito-base";
  if (summary.certainWrong > 0) return "Revise o ponto de confusão";
  if (summary.guessedCorrect > 0) return "Consolide para não depender do chute";
  return "Mantenha a revisão espaçada";
}

export function calculateNextStreak(currentStreak: number, lastStudyDate: string | undefined, today: string, yesterday: string) {
  if (lastStudyDate === today) return currentStreak;
  if (lastStudyDate === yesterday) return currentStreak + 1;
  return 1;
}

export function xpForAnswer(correct: boolean) {
  return correct ? 10 : 3;
}
