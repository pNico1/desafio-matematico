// Contexto de preferencias del usuario (última config elegida).
// Lo mantengo separado de HistoryContext porque las prefs no dependen del juego
// y se cargan al arrancar sin esperar nada del estado de la partida.
//
// Decisión consciente: NO renderizo loader global mientras isLoading=true.
// Mientras carga, devuelvo DEFAULT_PREFS. Si el usuario tocara "Comenzar" antes
// de que terminen de cargar las prefs reales (improbable: una lectura de
// AsyncStorage tarda decenas de ms), arrancaría con defaults — aceptable.
// La alternativa (bloquear UI con un spinner) suma fricción visible para el
// caso 99% común de "ya hay prefs guardadas".

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PREFS, UserPrefs } from '../types/game';
import { loadPrefs, savePrefs } from '../utils/storage';

interface PrefsContextValue {
  prefs: UserPrefs;
  isLoading: boolean;
  /**
   * Actualiza las prefs en memoria y dispara guardado a disco (fire-and-forget).
   * Si el guardado falla, lo logueamos pero no rompemos: la próxima sesión
   * arranca con defaults, no es catastrófico.
   */
  updatePrefs: (next: Partial<UserPrefs>) => void;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadPrefs();
        if (!cancelled) setPrefs(loaded);
      } catch (err) {
        console.warn('No se pudieron cargar las prefs, usando defaults', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePrefs = useCallback((patch: Partial<UserPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      // fire-and-forget: el guardado a disco no debe bloquear la UI.
      savePrefs(next).catch((err) => console.warn('No se pudieron guardar las prefs', err));
      return next;
    });
  }, []);

  const value = useMemo<PrefsContextValue>(
    () => ({ prefs, isLoading, updatePrefs }),
    [prefs, isLoading, updatePrefs],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs debe usarse dentro de <PrefsProvider>');
  return ctx;
}
