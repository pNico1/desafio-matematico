// Reducer puro del estado del juego.

import { Difficulty, GameMode } from '../navigation/types';
import {
  ADAPTIVE_TIME_FLOOR_MS,
  AnswerRecord,
  DIFFICULTY_PARAMS,
  Question,
} from '../types/game';
import { evaluateAnswer, summarize } from './scoring';

export interface GameState {
  mode: GameMode;
  difficulty: Difficulty;
  iterations: number;
  questions: Question[];
  currentIndex: number;
  answers: AnswerRecord[];
  status: 'idle' | 'playing' | 'finished';
  questionStartedAt: number;
  roundStartedAt: number;
  totalTimeLimitMs: number;
  /**
   * Tiempo por pregunta vigente. Arranca igual al elegido y, si adaptivo on,
   * decrementa por % en cada correcta. Floor en ADAPTIVE_TIME_FLOOR_MS.
   * Al avanzar, copiamos este valor al question.timeLimitMs de la proxima.
   */
  currentTimeLimitMs: number;
  adaptiveDifficulty: boolean;
  adaptiveReductionPct: number;
}

export type GameAction =
  | {
      type: 'START';
      payload: {
        mode: GameMode;
        difficulty: Difficulty;
        iterations: number;
        questions: Question[];
        now: number;
        timeLimitMs: number;
        adaptiveDifficulty: boolean;
      };
    }
  | { type: 'ANSWER'; payload: { userAnswer: string | number | boolean; now: number } }
  | { type: 'TIMEOUT'; payload: { now: number } }
  | { type: 'FINISH'; payload: { now: number } }
  | { type: 'RESET' };

export const initialState: GameState = {
  mode: 'classic',
  difficulty: 'easy',
  iterations: 0,
  questions: [],
  currentIndex: 0,
  answers: [],
  status: 'idle',
  questionStartedAt: 0,
  roundStartedAt: 0,
  totalTimeLimitMs: 0,
  currentTimeLimitMs: 0,
  adaptiveDifficulty: false,
  adaptiveReductionPct: 0,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START': {
      const { mode, difficulty, iterations, questions, now, timeLimitMs, adaptiveDifficulty } = action.payload;
      const totalTimeLimitMs = mode === 'timeattack'
        ? DIFFICULTY_PARAMS[difficulty].timeAttackTotalMs
        : 0;
      // Pisamos el timeLimitMs de cada pregunta con el elegido por el usuario.
      // El generador asigna el default de la dificultad, pero en runtime manda
      // lo que eligio en el slider de Config.
      const adjustedQuestions = questions.map((q) => ({ ...q, timeLimitMs }));
      return {
        mode,
        difficulty,
        iterations,
        questions: adjustedQuestions,
        currentIndex: 0,
        answers: [],
        status: 'playing',
        questionStartedAt: now,
        roundStartedAt: now,
        totalTimeLimitMs,
        currentTimeLimitMs: timeLimitMs,
        adaptiveDifficulty,
        adaptiveReductionPct: DIFFICULTY_PARAMS[difficulty].adaptiveReductionPct,
      };
    }

    case 'ANSWER': {
      if (state.status !== 'playing') return state;
      const question = state.questions[state.currentIndex];
      if (!question) return state;
      const responseMs = action.payload.now - state.questionStartedAt;
      const record = evaluateAnswer(question, action.payload.userAnswer, responseMs);
      return advance(state, record, action.payload.now);
    }

    case 'TIMEOUT': {
      if (state.status !== 'playing') return state;
      const question = state.questions[state.currentIndex];
      if (!question) return state;
      const record = evaluateAnswer(question, null, question.timeLimitMs);
      return advance(state, record, action.payload.now);
    }

    case 'FINISH': {
      return { ...state, status: 'finished' };
    }

    case 'RESET':
      return initialState;
  }
}

function advance(state: GameState, record: AnswerRecord, now: number): GameState {
  const answers = [...state.answers, record];
  const nextIndex = state.currentIndex + 1;

  const isTimeAttack = state.mode === 'timeattack';
  const elapsedRound = now - state.roundStartedAt;
  const timeUp = isTimeAttack && elapsedRound >= state.totalTimeLimitMs;
  const firstFail = isTimeAttack && !record.isCorrect;
  const normalDone = !isTimeAttack && nextIndex >= state.iterations;

  if (normalDone || timeUp || firstFail) {
    return { ...state, answers, status: 'finished', currentIndex: nextIndex };
  }

  // Dificultad adaptativa: en cada correcta reducimos el tiempo por % con piso.
  // Compuesto: cada correcta sucesiva achica un poco mas el tiempo.
  let nextTimeLimitMs = state.currentTimeLimitMs;
  let nextQuestions = state.questions;
  if (state.adaptiveDifficulty && record.isCorrect) {
    nextTimeLimitMs = Math.max(
      ADAPTIVE_TIME_FLOOR_MS,
      Math.floor(state.currentTimeLimitMs * (1 - state.adaptiveReductionPct)),
    );
    // Reescribimos timeLimitMs de la PROXIMA pregunta (no la actual: ya fue
    // respondida). Asi el timer y el scoring usan el valor reducido.
    if (nextIndex < state.questions.length) {
      nextQuestions = state.questions.slice();
      nextQuestions[nextIndex] = { ...nextQuestions[nextIndex], timeLimitMs: nextTimeLimitMs };
    }
  }

  return {
    ...state,
    answers,
    questions: nextQuestions,
    currentIndex: nextIndex,
    questionStartedAt: now,
    currentTimeLimitMs: nextTimeLimitMs,
  };
}

export function snapshotOf(state: GameState): {
  score: number;
  correct: number;
  incorrect: number;
  skipped: number;
  avgResponseMs: number;
} {
  return summarize(state.answers);
}
