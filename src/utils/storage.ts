// Capa única de persistencia. Toda lectura/escritura de AsyncStorage pasa por acá.
// Si en el futuro hay que migrar a otra librería (SQLite, MMKV, etc.), se cambia un solo archivo.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BestScoreMap, bestKey, DEFAULT_PREFS, RoundRecord, UserPrefs } from '../types/game';

const KEY_HISTORY = '@desafio:history:v1';
const KEY_BEST = '@desafio:best:v1';
const KEY_PREFS = '@desafio:prefs:v1';

const HISTORY_MAX = 100; // límite duro para no inflar AsyncStorage indefinidamente

async function safeParse<T>(raw: string | null, fallback: T): Promise<T> {
  if (raw == null) return fallback;
  try {
    const v = JSON.parse(raw);
    return v as T;
  } catch {
    // si el JSON está corrupto preferimos perderlo a romper la app
    return fallback;
  }
}

export async function loadHistory(): Promise<RoundRecord[]> {
  const raw = await AsyncStorage.getItem(KEY_HISTORY);
  const list = await safeParse<RoundRecord[]>(raw, []);
  // ordenamos por fecha descendente por si algo se desordenó
  return Array.isArray(list)
    ? list.slice().sort((a, b) => b.finishedAt - a.finishedAt)
    : [];
}

export async function saveHistory(records: RoundRecord[]): Promise<void> {
  // cap defensivo: nunca persistimos más de HISTORY_MAX
  const trimmed = records.slice(0, HISTORY_MAX);
  await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify(trimmed));
}

export async function appendToHistory(record: RoundRecord): Promise<RoundRecord[]> {
  const current = await loadHistory();
  // evitar duplicados si la misma ronda se intenta guardar dos veces
  if (current.some((r) => r.id === record.id)) return current;
  const next = [record, ...current].slice(0, HISTORY_MAX);
  await saveHistory(next);
  return next;
}

export async function loadBestScores(): Promise<BestScoreMap> {
  const raw = await AsyncStorage.getItem(KEY_BEST);
  const map = await safeParse<BestScoreMap>(raw, {});
  return map && typeof map === 'object' ? map : {};
}

export async function saveBestScores(map: BestScoreMap): Promise<void> {
  await AsyncStorage.setItem(KEY_BEST, JSON.stringify(map));
}

/**
 * Resultado de aplicar la lógica de "récord".
 * - `map`: el mapa de bests luego de la actualización (cambió o no).
 * - `previousBest`: el récord previo para esa combinación (undefined si no había).
 * - `isNewRecord`: true si esta ronda quedó como nuevo mejor puntaje.
 *
 * Devolvemos `previousBest` además del flag porque la UI puede querer mostrar
 * "superaste tu récord previo de X" — el flag solo no alcanza.
 */
export interface BestUpdateResult {
  map: BestScoreMap;
  previousBest: RoundRecord | undefined;
  isNewRecord: boolean;
}

/**
 * Aplica la lógica de "récord": si la ronda supera el mejor previo para esa combinación
 * modo+dificultad, lo reemplaza.
 */
export async function updateBestIfRecord(record: RoundRecord): Promise<BestUpdateResult> {
  const map = await loadBestScores();
  const key = bestKey(record.mode, record.difficulty);
  const prev = map[key];
  // Empate NO cuenta como nuevo récord. Es discutible — si quisiéramos que un empate
  // con menor tiempo promedio cuente, habría que comparar también avgResponseMs.
  // Para Fase 4 lo dejamos simple: solo gana puntaje estricto.
  if (!prev || record.score > prev.score) {
    const next: BestScoreMap = { ...map, [key]: record };
    await saveBestScores(next);
    return { map: next, previousBest: prev, isNewRecord: true };
  }
  return { map, previousBest: prev, isNewRecord: false };
}

/**
 * Borra historial y récords. NO borra las prefs (esas son comodidad del usuario,
 * no datos de juego). Si en el futuro quisiéramos un "reset total", agregar otra fn.
 */
export async function clearAllPersisted(): Promise<void> {
  await AsyncStorage.multiRemove([KEY_HISTORY, KEY_BEST]);
}

// --- Preferencias de usuario ---

export async function loadPrefs(): Promise<UserPrefs> {
  const raw = await AsyncStorage.getItem(KEY_PREFS);
  const parsed = await safeParse<Partial<UserPrefs> | null>(raw, null);
  if (!parsed || typeof parsed !== 'object') return DEFAULT_PREFS;
  // Mergeamos con defaults para que un schema más viejo (sin algún campo) no rompa.
  // Esto sustituye a una migración formal en este tamaño de proyecto.
  return {
    mode: parsed.mode ?? DEFAULT_PREFS.mode,
    difficulty: parsed.difficulty ?? DEFAULT_PREFS.difficulty,
    iterations:
      typeof parsed.iterations === 'number' && parsed.iterations > 0
        ? parsed.iterations
        : DEFAULT_PREFS.iterations,
  };
}

export async function savePrefs(prefs: UserPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY_PREFS, JSON.stringify(prefs));
}

// Exporto las keys por si hace falta debuggear desde fuera.
export const STORAGE_KEYS = { KEY_HISTORY, KEY_BEST, KEY_PREFS } as const;
