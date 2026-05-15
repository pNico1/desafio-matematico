// Agregaciones puras sobre el historial.
// Este archivo no importa React ni react-native a proposito: la pantalla
// StatsScreen (que si los usa) le pide los numeros a estas funciones.

import { Difficulty, GameMode } from '../navigation/types';
import { BestScoreMap, RoundRecord, bestKey } from '../types/game';

export interface AggregateStats {
  totalRounds: number;
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
  totalScore: number;
  avgScorePerRound: number;
  accuracy: number;
  avgResponseMs: number;
}

export interface ModeBreakdown {
  mode: GameMode;
  count: number;
  share: number;
}

export const EMPTY_STATS: AggregateStats = {
  totalRounds: 0,
  totalQuestions: 0,
  totalCorrect: 0,
  totalIncorrect: 0,
  totalSkipped: 0,
  totalScore: 0,
  avgScorePerRound: 0,
  accuracy: 0,
  avgResponseMs: 0,
};

export function aggregateStats(history: RoundRecord[]): AggregateStats {
  if (history.length === 0) return EMPTY_STATS;

  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalSkipped = 0;
  let totalScore = 0;
  let weightedMsSum = 0;

  for (const r of history) {
    totalQuestions += r.totalQuestions;
    totalCorrect += r.correct;
    totalIncorrect += r.incorrect;
    totalSkipped += r.skipped;
    totalScore += r.score;
    weightedMsSum += r.avgResponseMs * r.totalQuestions;
  }

  return {
    totalRounds: history.length,
    totalQuestions,
    totalCorrect,
    totalIncorrect,
    totalSkipped,
    totalScore,
    avgScorePerRound: totalScore / history.length,
    accuracy: totalQuestions === 0 ? 0 : totalCorrect / totalQuestions,
    avgResponseMs: totalQuestions === 0 ? 0 : weightedMsSum / totalQuestions,
  };
}

export function modeBreakdown(history: RoundRecord[]): ModeBreakdown[] {
  const counts: Record<GameMode, number> = {
    classic: 0,
    truefalse: 0,
    multichoice: 0,
    timeattack: 0,
  };
  for (const r of history) counts[r.mode]++;
  const total = history.length;
  const modes: GameMode[] = ['classic', 'truefalse', 'multichoice', 'timeattack'];
  return modes
    .map((mode) => ({
      mode,
      count: counts[mode],
      share: total === 0 ? 0 : counts[mode] / total,
    }))
    .sort((a, b) => b.count - a.count);
}

export interface BestGridCell {
  mode: GameMode;
  difficulty: Difficulty;
  record: RoundRecord | null;
}

export const MODES_ORDER: GameMode[] = ['classic', 'truefalse', 'multichoice', 'timeattack'];
export const DIFFS_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

export function bestScoresGrid(bests: BestScoreMap): BestGridCell[][] {
  return MODES_ORDER.map((mode) =>
    DIFFS_ORDER.map((difficulty) => ({
      mode,
      difficulty,
      record: bests[bestKey(mode, difficulty)] ?? null,
    })),
  );
}
