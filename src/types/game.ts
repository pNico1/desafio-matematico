// Tipos del dominio del juego.
// Separados de la navegacion para que la logica sea pura y testeable.

import { Difficulty, GameMode } from '../navigation/types';

export type Operator = '+' | '-' | '*' | '/';

export interface Operation {
  a: number;
  b: number;
  operator: Operator;
  result: number; // resultado correcto (siempre entero)
}

/**
 * Una pregunta combina una operacion con la info especifica del modo.
 * - classic / timeattack: solo la operacion.
 * - truefalse: la operacion + un resultado mostrado (puede coincidir o no).
 * - multichoice: la operacion + 4 opciones (una correcta).
 */
export interface Question {
  id: string;            // unico por ronda, util para keys de listas
  operation: Operation;
  mode: GameMode;
  timeLimitMs: number;   // tiempo maximo de respuesta
  options?: number[];           // multichoice
  shownResult?: number;         // truefalse
  isShownCorrect?: boolean;     // truefalse - true si shownResult === operation.result
}

export type AnswerCategory = 'fast' | 'ok' | 'wrong' | 'timeout';

export interface AnswerRecord {
  questionId: string;
  userAnswer: string | number | boolean | null; // null = timeout
  isCorrect: boolean;
  responseMs: number;
  category: AnswerCategory;
  points: number;           // delta aplicado al score
}

export interface GameSnapshot {
  mode: GameMode;
  difficulty: Difficulty;
  iterations: number;       // 0 en timeattack
  totalQuestions: number;
  answered: number;
  correct: number;
  incorrect: number;
  skipped: number;
  score: number;
  avgResponseMs: number;
  finishedAt: number;
}

// Parametrizacion por dificultad. Centralizada aca para no esparcirla por el codigo.
// Los caps de mul/div estan separados porque las sumas/restas escalan linealmente
// con maxOperand, pero la multiplicacion/division mental tiene un tope practico
// (alrededor de 12x12) mas alla del cual deja de ser calculo mental.
export interface DifficultyParams {
  minOperand: number;
  maxOperand: number;
  /** Factor maximo para multiplicacion. Se usa min(maxOperand, maxMulFactor). */
  maxMulFactor: number;
  /** Factor maximo para divisor y cociente en division. */
  maxDivFactor: number;
  allowedOperators: Operator[];
  timeLimitMs: number;
  /** Solo timeattack: tiempo total de la sesion. */
  timeAttackTotalMs: number;
}

export const DIFFICULTY_PARAMS: Record<Difficulty, DifficultyParams> = {
  // Facil: rango chico, solo suma/resta, tiempo amplio para acostumbrarse.
  easy: {
    minOperand: 1,
    maxOperand: 10,
    maxMulFactor: 6, // no se usa (sin '*'), valor de relleno
    maxDivFactor: 5, // no se usa (sin '/'), valor de relleno
    allowedOperators: ['+', '-'],
    timeLimitMs: 12000,
    timeAttackTotalMs: 60000,
  },
  // Medio: salto fuerte en rango (1-10 a 5-25), agrega multiplicacion,
  // tiempo casi a la mitad.
  medium: {
    minOperand: 5,
    maxOperand: 25,
    maxMulFactor: 10,
    maxDivFactor: 10,
    allowedOperators: ['+', '-', '*'],
    timeLimitMs: 7000,
    timeAttackTotalMs: 90000,
  },
  // Dificil: rango grande (10-50), las cuatro operaciones, tiempo apretado.
  // Mul/div topeadas a 12 - ir mas arriba ya no es calculo mental razonable.
  hard: {
    minOperand: 10,
    maxOperand: 50,
    maxMulFactor: 12,
    maxDivFactor: 12,
    allowedOperators: ['+', '-', '*', '/'],
    timeLimitMs: 4000,
    timeAttackTotalMs: 120000,
  },
};

// --- Persistencia (Fase 4) ---

/** Registro completo de una ronda finalizada. Lo que se guarda en historial. */
export interface RoundRecord {
  id: string;             // unico, derivado de roundStartedAt + mode + difficulty
  mode: GameMode;
  difficulty: Difficulty;
  iterations: number;     // 0 = timeattack
  totalQuestions: number; // cantidad de preguntas respondidas (timeattack puede variar)
  score: number;
  correct: number;
  incorrect: number;
  skipped: number;
  avgResponseMs: number;
  finishedAt: number;     // epoch ms
}

/** Mapa de mejor puntaje por combinacion modo+dificultad. */
export type BestScoreKey = `${GameMode}:${Difficulty}`;
export type BestScoreMap = Partial<Record<BestScoreKey, RoundRecord>>;

export function bestKey(mode: GameMode, difficulty: Difficulty): BestScoreKey {
  return `${mode}:${difficulty}`;
}

/**
 * Preferencias del usuario (ultima config elegida).
 * Se persisten en AsyncStorage para que al reabrir la app aparezca pre-seleccionada
 * la ultima combinacion. NO confundir con el estado de la partida actual, que vive
 * en GameContext y no se persiste (cerrar la app abandona la ronda en curso).
 */
export interface UserPrefs {
  mode: GameMode;
  difficulty: Difficulty;
  iterations: number;
}

export const DEFAULT_PREFS: UserPrefs = {
  mode: 'classic',
  difficulty: 'easy',
  iterations: 10,
};
