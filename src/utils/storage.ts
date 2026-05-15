// Capa unica de persistencia. Toda lectura/escritura de AsyncStorage pasa por aca.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { BestScoreMap, bestKey, DEFAULT_PREFS, RoundRecord, UserPrefs } from '../types/game';

const KEY_HISTORY = '@desafio:history:v1';
const KEY_BEST = '@desafio:best:v1';
const KEY_PREFS = '@desafio:prefs:v1';

const HISTORY_MAX = 100;

async function safeParse<T>(raw: string | null, fallback: T): Promise<T> {
  if (raw == null) return fallback;
  try {
    const v = JSON.parse(raw);
    return v as T;
  } catch {
    return fallback;
  }
}

export async function loadHistory(): Promise<RoundRecord[]> {
  const raw = await AsyncStorage.getItem(KEY_HISTORY);
  const list = await safeParse<RoundRecord[]>(raw, []);
  return Array.isArray(list)
    ? list.slice().sort((a, b) => b.finishedAt - a.finishedAt)
    : [];
}

export async function saveHistory(records: RoundRecord[]): Promise<void> {
  const trimmed = records.slice(0, HISTORY_MAX);
  await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify(trimmed));
}

export async function appendToHistory(record: RoundRecord): Promise<RoundRecord[]> {
  const current = await loadHistory();
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

export interface BestUpdateResult {
  map: BestScoreMap;
  previousBest: RoundRecord | undefined;
  isNewRecord: boolean;
}

export async function updateBestIfRecord(record: RoundRecord): Promise<BestUpdateResult> {
  const map = await loadBestScores();
  const key = bestKey(record.mode, record.difficulty);
  const prev = map[key];
  if (!prev || record.score > prev.score) {
    const next: BestScoreMap = { ...map, [key]: record };
    await saveBestScores(next);
    return { map: next, previousBest: prev, isNewRecord: true };
  }
  return { map, previousBest: prev, isNewRecord: false };
}

export async function clearAllPersisted(): Promise<void> {
  await AsyncStorage.multiRemove([KEY_HISTORY, KEY_BEST]);
}

// --- Preferencias de usuario ---

export async function loadPrefs(): Promise<UserPrefs> {
  const raw = await AsyncStorage.getItem(KEY_PREFS);
  const parsed = await safeParse<Partial<UserPrefs> | null>(raw, null);
  if (!parsed || typeof parsed !== 'object') return DEFAULT_PREFS;
  return {
    mode: parsed.mode ?? DEFAULT_PREFS.mode,
    difficulty: parsed.difficulty ?? DEFAULT_PREFS.difficulty,
    iterations:
      typeof parsed.iterations === 'number' && parsed.iterations > 0
        ? parsed.iterations
        : DEFAULT_PREFS.iterations,
    timeLimitMs:
      typeof parsed.timeLimitMs === 'number' && parsed.timeLimitMs >= 0
        ? parsed.timeLimitMs
        : DEFAULT_PREFS.timeLimitMs,
    adaptiveDifficulty:
      typeof parsed.adaptiveDifficulty === 'boolean'
        ? parsed.adaptiveDifficulty
        : DEFAULT_PREFS.adaptiveDifficulty,
  };
}

export async function savePrefs(prefs: UserPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY_PREFS, JSON.stringify(prefs));
}

export const STORAGE_KEYS = { KEY_HISTORY, KEY_BEST, KEY_PREFS } as const;
