export const calculateMatchScore = (
  basePoints: number,
  streak: number,
  streakStep: number,
): number => {
  const effectiveStreak = Math.max(0, streak - 1);
  const multiplier = 1 + effectiveStreak * streakStep;
  return Math.round(basePoints * multiplier);
};

export const applyMismatchPenalty = (currentScore: number, penalty: number): number =>
  Math.max(0, currentScore - penalty);

export default {
  calculateMatchScore,
  applyMismatchPenalty,
};
