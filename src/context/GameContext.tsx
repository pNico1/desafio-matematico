// Provider de estado del juego.
// Envuelve la app y expone state + dispatch + helpers via useGame().

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { Difficulty, GameMode } from '../navigation/types';
import { gameReducer, GameState, initialState, snapshotOf } from '../utils/gameReducer';
import { generateQuestion, generateRound } from '../utils/generator';
import { DIFFICULTY_PARAMS } from '../types/game';

interface GameContextValue {
  state: GameState;
  start: (mode: GameMode, difficulty: Difficulty, iterations: number) => void;
  answer: (userAnswer: string | number | boolean) => void;
  timeout: () => void;
  reset: () => void;
  // helper: remaining ms para la pregunta actual (no es reactivo, llamarlo cada tick)
  remainingMs: () => number;
  totalRemainingMs: () => number; // sólo timeattack
  // pregunta actual (puede ser undefined si terminó)
  currentQuestion: () => GameState['questions'][number] | undefined;
  // resumen para la pantalla de resultados
  snapshot: () => ReturnType<typeof snapshotOf>;
}

const GameContext = createContext<GameContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  // permitir inyectar un now() y un RNG para tests
  nowProvider?: () => number;
}

export function GameProvider({ children, nowProvider = Date.now }: ProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const start = useCallback((mode: GameMode, difficulty: Difficulty, iterations: number) => {
    // En timeattack arrancamos con un buffer chico y vamos completando bajo demanda.
    // En el resto, generamos las N preguntas de una.
    const n = mode === 'timeattack' ? Math.max(50, iterations || 50) : iterations;
    const questions = generateRound(mode, difficulty, n);
    dispatch({
      type: 'START',
      payload: { mode, difficulty, iterations, questions, now: nowProvider() },
    });
  }, [nowProvider]);

  const answer = useCallback((userAnswer: string | number | boolean) => {
    dispatch({ type: 'ANSWER', payload: { userAnswer, now: nowProvider() } });
  }, [nowProvider]);

  const timeout = useCallback(() => {
    dispatch({ type: 'TIMEOUT', payload: { now: nowProvider() } });
  }, [nowProvider]);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const currentQuestion = useCallback(() => {
    const s = stateRef.current;
    return s.questions[s.currentIndex];
  }, []);

  const remainingMs = useCallback(() => {
    const s = stateRef.current;
    const q = s.questions[s.currentIndex];
    if (!q) return 0;
    const elapsed = nowProvider() - s.questionStartedAt;
    return Math.max(0, q.timeLimitMs - elapsed);
  }, [nowProvider]);

  const totalRemainingMs = useCallback(() => {
    const s = stateRef.current;
    if (s.mode !== 'timeattack' || s.totalTimeLimitMs <= 0) return 0;
    const elapsed = nowProvider() - s.roundStartedAt;
    return Math.max(0, s.totalTimeLimitMs - elapsed);
  }, [nowProvider]);

  const snapshot = useCallback(() => snapshotOf(stateRef.current), []);

  const value = useMemo<GameContextValue>(() => ({
    state, start, answer, timeout, reset, remainingMs, totalRemainingMs, currentQuestion, snapshot,
  }), [state, start, answer, timeout, reset, remainingMs, totalRemainingMs, currentQuestion, snapshot]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame debe usarse dentro de <GameProvider>');
  return ctx;
}
