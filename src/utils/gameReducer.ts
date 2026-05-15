// Reducer puro del estado del juego.
// Recibe acciones y devuelve el siguiente estado, sin tocar UI ni storage.
// Esto permite testearlo aislado y reemplazar la UI sin reescribir lógica.

import { Difficulty, GameMode } from '../navigation/types';
import { AnswerRecord, DIFFICULTY_PARAMS, Question } from '../types/game';
import { evaluateAnswer, summarize } from './scoring';
import { generateQuestion } from './generator';

export interface GameState {
  mode: GameMode;
  difficulty: Difficulty;
  iterations: number;            // 0 = timeattack ilimitado
  questions: Question[];
  currentIndex: number;
  answers: AnswerRecord[];
  status: 'idle' | 'playing' | 'finished';
  // timestamps en ms (epoch o relativos al monotonic clock)
  questionStartedAt: number;     // 0 si no arrancó
  roundStartedAt: number;
  totalTimeLimitMs: number;      // sólo timeattack > 0
}

export type GameAction =
  | { type: 'START'; payload: { mode: GameMode; difficulty: Difficulty; iterations: number; questions: Question[]; now: number } }
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
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START': {
      const { mode, difficulty, iterations, questions, now } = action.payload;
      const totalTimeLimitMs = mode === 'timeattack'
        ? DIFFICULTY_PARAMS[difficulty].timeAttackTotalMs
        : 0;
      return {
        mode,
        difficulty,
        iterations,
        questions,
        currentIndex: 0,
        answers: [],
        status: 'playing',
        questionStartedAt: now,
        roundStartedAt: now,
        totalTimeLimitMs,
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

  // Reglas de fin de juego según modo:
  // - classic/truefalse/multichoice: termina al completar `iterations`.
  // - timeattack: termina al primer fallo o al agotarse el tiempo total.
  const isTimeAttack = state.mode === 'timeattack';
  const elapsedRound = now - state.roundStartedAt;
  const timeUp = isTimeAttack && elapsedRound >= state.totalTimeLimitMs;
  const firstFail = isTimeAttack && !record.isCorrect;
  const normalDone = !isTimeAttack && nextIndex >= state.iterations;

  if (normalDone || timeUp || firstFail) {
    return { ...state, answers, status: 'finished', currentIndex: nextIndex };
  }

  // Si en timeattack consumimos el buffer, generamos más preguntas en otro lado;
  // acá solo avanzamos el índice y reiniciamos el timer.
  return {
    ...state,
    answers,
    currentIndex: nextIndex,
    questionStartedAt: now,
  };
}

/**
 * Devuelve el resumen agregado de la ronda.
 */
export function snapshotOf(state: GameState): {
  score: number;
  correct: number;
  incorrect: number;
  skipped: number;
  avgResponseMs: number;
} {
  return summarize(state.answers);
}
