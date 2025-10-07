import type { CardDefinition } from '../core/board/BoardGenerator';

export const isMatchingPair = (
  first: Pick<CardDefinition, 'matchId'>,
  second: Pick<CardDefinition, 'matchId'>,
): boolean => first.matchId === second.matchId;

export default {
  isMatchingPair,
};
