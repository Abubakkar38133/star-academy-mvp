import { GKQuestion } from '../types';

/**
 * Shuffles the 4 options of a question and updates correctIndex accordingly.
 * This guarantees the correct answer is NOT always 'B' (index 1),
 * but evenly and randomly distributed among A, B, C, and D.
 */
export function shuffleQuestionOptions(question: GKQuestion): GKQuestion {
  if (!question || !question.options || question.options.length < 2) {
    return question;
  }

  const correctText = question.options[question.correctIndex];
  const originalOptions = [...question.options];

  // Fisher-Yates shuffle
  const shuffledOptions = [...originalOptions];
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }

  // Find where the correct answer ended up
  let newCorrectIndex = shuffledOptions.indexOf(correctText);
  if (newCorrectIndex === -1) {
    newCorrectIndex = 0;
  }

  return {
    ...question,
    options: shuffledOptions,
    correctIndex: newCorrectIndex,
  };
}

/**
 * Helper to shuffle an entire array of items
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
