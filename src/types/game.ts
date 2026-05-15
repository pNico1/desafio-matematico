// Tipos del dominio del juego.
// Separados de la navegacion para que la logica sea pura y testeable.

import { Difficulty, GameMode } from '../navigation/types';

export type Operator = '+' | '-' | '*' | '/';

export interface Operation {
  a: number;
  b: number;
  operator: Operator;
  result: number;
}

export interface Question {
  id: string;
  operation: Operation;
  mode: GameMode;
  timeLimitMs: number;
  options?: number[];
  shownResult?: number;
  isShownCorrect?: boolean;
}

export type AnswerCategory = 'fast' | 'ok' | 'wrong' | 'timeout';

export interface AnswerRecord {
  questionId: string;
  userAnswer: string | number | boolean | null;
  isCorrect: boolean;
  responseMs: number;
  category: AnswerCategory;
  points: number;
}

export interface GameSnapshot {
  mode: GameMode;
  difficulty: Difficulty;
  iterations: number;
  totalQuestions: number;
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  avgResponseMs: number;
  finishedAt: number;
}

// Parametrizacion por dificultad.
export interface DifficultyParams {
  minOperand: number;
  maxOperand: number;
  /** Factor maximo para multiplicacion. Se usa min(maxOperand, maxMulFactor). */
  maxMulFactor: number;
  /** Factor maximo para divisor y cociente en division. */
  maxDivFactor: number;
  allowedOperators: Operator[];
  /** Tiempo por defecto por pregunta (sugerido). El usuario puede sobreescribir. */
  timeLimitMs: number;
  /** Solo timeattack: tiempo total de la sesion. */
  timeAttackTotalMs: number;
  /** Reduccion del tiempo por correcta cuando adaptativo on. Fraccion (0.03 = 3%). */
  adaptiveReductionPct: number;
}

export const DIFFICULTY_PARAMS: Record<Difficulty, DifficultyParams> = {
  easy: {
    minOperand: 1,
    maxOperand: 10,
    maxMulFactor: 6,
    maxDivFactor: 5,
    allowedOperators: ['+', '-'],
    timeLimitMs: 12000,
    timeAttackTotalMs: 60000,
    adaptiveReductionPct: 0.03,
  },
  medium: {
    minOperand: 5,
    maxOperand: 25,
    maxMulFactor: 10,
    maxDivFactor: 10,
    allowedOperators: ['+', '-', '*'],
    timeLimitMs: 7000,
    timeAttackTotalMs: 90000,
    adaptiveReductionPct: 0.04,
  },
  hard: {
    minOperand: 10,
    maxOperand: 50,
    maxMulFactor: 12,
    maxDivFactor: 12,
    allowedOperators: ['+', '-', '*', '/'],
    timeLimitMs: 4000,
    timeAttackTotalMs: 120000,
    adaptiveReductionPct: 0.05,
  },
};

/** Piso de tiempo cuando dificultad adaptativa esta on. */
export const ADAPTIVE_TIME_FLOOR_MS = 1000;
/** Rangos del slider de tiempo por pregunta en Config. */
export const TIME_LIMIT_MIN_MS = 2000;
export const TIME_LIMIT_MAX_MS = 20000;
export const TIME_LIMIT_STEP_MS = 500;
/** Rango del slider de cantidad de operaciones en Config. */
export const ITERATIONS_MIN = 5;
export const ITERATIONS_MAX = 25;

// --- Persistencia (Fase 4) ---

export interface RoundRecord {
  id: string;
  mode: GameMode;
  difficulty: Difficulty;
  iterations: number;
  totalQuestions: number;
  score: number;
  correct: number;
  incorrect: number;
  skipped: number;
  avgResponseMs: number;
  finishedAt: number;
}

export type BestScoreKey = `${GameMode}:${Difficulty}`;
export type BestScoreMap = Partial<Record<BestScoreKey, RoundRecord>>;

export function bestKey(mode: GameMode, difficulty: Difficulty): BestScoreKey {
  return `${mode}:${difficulty}`;
}

export interface UserPrefs {
  mode: GameMode;
  difficulty: Difficulty;
  iterations: number;
  /** 0 = usar default de la dificultad. Si >0, el usuario eligio explicitamente. */
  timeLimitMs: number;
  adaptiveDifficulty: boolean;
}

export const DEFAULT_PREFS: UserPrefs = {
  mode: 'classic',
  difficulty: 'easy',
  iterations: 10,
  timeLimitMs: 0,
  adaptiveDifficulty: false,
};

/** Convierte el timeLimitMs de prefs (0 = default) en el ms concreto a usar. */
export function resolveTimeLimitMs(prefs: UserPrefs): number {
  if (prefs.timeLimitMs <= 0) return DIFFICULTY_PARAMS[prefs.difficulty].timeLimitMs;
  return Math.min(TIME_LIMIT_MAX_MS, Math.max(TIME_LIMIT_MIN_MS, prefs.timeLimitMs));
}
