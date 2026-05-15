import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BestScoreMap, RoundRecord } from '../types/game';
import {
  appendToHistory,
  clearAllPersisted,
  loadBestScores,
  loadHistory,
  updateBestIfRecord,
} from '../utils/storage';
import { useGame } from './GameContext';

interface HistoryContextValue {
  history: RoundRecord[];
  bestScores: BestScoreMap;
  isLoading: boolean;
  /**
   * Información de la última ronda guardada (la actual si Results está abierta).
   * Permite que ResultsScreen muestre badges sin tener que comparar a mano.
   * Se limpia cuando se inicia una ronda nueva.
   */
  lastSaved: {
    record: RoundRecord;
    previousBest: RoundRecord | undefined;
    isNewRecord: boolean;
  } | null;
  /** Borra historial y récords (con confirmación de UI aparte). */
  clearAll: () => Promise<void>;
  /** Recarga desde storage (útil después de borrar). */
  reload: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

/**
 * Provider que vive adentro de GameProvider.
 * - En mount: carga historial y récords desde AsyncStorage.
 * - Escucha cambios de estado de GameContext.
 *   Cuando una ronda transiciona a 'finished', construye un RoundRecord y lo persiste.
 *   Usa un ref para evitar grabar la misma ronda dos veces (re-renders o navegación).
 */
export function HistoryProvider({ children }: { children: ReactNode }) {
  const { state, snapshot } = useGame();
  const [history, setHistory] = useState<RoundRecord[]>([]);
  const [bestScores, setBestScores] = useState<BestScoreMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState<HistoryContextValue['lastSaved']>(null);
  const lastSavedKeyRef = useRef<string | null>(null);

  const reload = useCallback(async () => {
    const [h, b] = await Promise.all([loadHistory(), loadBestScores()]);
    setHistory(h);
    setBestScores(b);
  }, []);

  // Carga inicial.
  useEffect(() => {
    (async () => {
      try {
        await reload();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [reload]);

  // Cuando arranca una nueva ronda, reseteamos la flag de "guardado" así puede
  // grabarse al terminar. También limpiamos lastSaved para que el badge de
  // "Nuevo récord" no quede colgado de la ronda anterior.
  useEffect(() => {
    if (state.status === 'playing') {
      lastSavedKeyRef.current = null;
      setLastSaved(null);
    }
  }, [state.status]);

  // Auto-guardado al terminar una ronda.
  useEffect(() => {
    if (state.status !== 'finished') return;
    if (state.answers.length === 0) return; // ronda sin respuestas: no guardar
    const key = `${state.roundStartedAt}-${state.mode}-${state.difficulty}`;
    if (lastSavedKeyRef.current === key) return;
    lastSavedKeyRef.current = key;

    const s = snapshot();
    const record: RoundRecord = {
      id: key,
      mode: state.mode,
      difficulty: state.difficulty,
      iterations: state.iterations,
      totalQuestions: state.answers.length,
      score: s.score,
      correct: s.correct,
      incorrect: s.incorrect,
      skipped: s.skipped,
      avgResponseMs: s.avgResponseMs,
      finishedAt: Date.now(),
    };

    (async () => {
      try {
        const nextHistory = await appendToHistory(record);
        const bestResult = await updateBestIfRecord(record);
        setHistory(nextHistory);
        setBestScores(bestResult.map);
        setLastSaved({
          record,
          previousBest: bestResult.previousBest,
          isNewRecord: bestResult.isNewRecord,
        });
      } catch (err) {
        // En un proyecto real acá iría un logger / Sentry.
        // Como no hay internet, sólo silenciamos y dejamos el estado en memoria.
        console.warn('No se pudo persistir la ronda', err);
      }
    })();
  }, [state.status, state.answers.length, state.mode, state.difficulty, state.iterations, state.roundStartedAt, snapshot]);

  const clearAll = useCallback(async () => {
    await clearAllPersisted();
    setHistory([]);
    setBestScores({});
    setLastSaved(null);
  }, []);

  const value = useMemo<HistoryContextValue>(
    () => ({ history, bestScores, isLoading, lastSaved, clearAll, reload }),
    [history, bestScores, isLoading, lastSaved, clearAll, reload],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useHistory(): HistoryContextValue {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory debe usarse dentro de <HistoryProvider>');
  return ctx;
}
