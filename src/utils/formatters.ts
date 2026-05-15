// Funciones puras de formateo (strings, fechas, porcentajes).
// Este archivo NO importa nada de react-native a proposito: las pantallas
// (que si usan RN con View/Text/FlatList/etc.) consumen estas funciones.
// Mantenerlas aisladas de la UI permite reutilizarlas y testearlas mas facil.
// NO significa que la app no use RN: la app entera es React Native + Expo.

import { Difficulty, GameMode } from '../navigation/types';

const MODE_LABELS: Record<GameMode, string> = {
  classic: 'Clasico',
  truefalse: 'V/F',
  multichoice: 'M. choice',
  timeattack: 'C. reloj',
};

const DIFF_LABELS: Record<Difficulty, string> = {
  easy: 'Facil',
  medium: 'Medio',
  hard: 'Dificil',
};

export function modeLabel(m: GameMode): string {
  return MODE_LABELS[m];
}

export function difficultyLabel(d: Difficulty): string {
  return DIFF_LABELS[d];
}

export function formatDateShort(epochMs: number): string {
  const d = new Date(epochMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${yy} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatPercent(ratio: number): string {
  if (!isFinite(ratio)) return '-';
  return `${Math.round(ratio * 100)}%`;
}
