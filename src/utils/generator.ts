// Generador puro de operaciones y preguntas.
// "Puro" significa: dada la misma funcion de RNG, devuelve siempre lo mismo.
// Por eso se acepta `rng` como parametro opcional - util para tests deterministicos.

import { Difficulty, GameMode } from '../navigation/types';
import {
  DIFFICULTY_PARAMS,
  Operation,
  Operator,
  Question,
} from '../types/game';

export type RNG = () => number; // contrato: 0 <= rng() < 1, igual que Math.random

const defaultRng: RNG = Math.random;

function pickInt(min: number, max: number, rng: RNG): number {
  // ambos inclusive
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(arr: T[], rng: RNG): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Genera una operacion matematica valida para la dificultad indicada.
 * Garantias:
 *  - Resta nunca da resultado negativo (intercambia operandos si hace falta).
 *  - Division siempre da entero (se construye desde el cociente).
 *  - Multiplicacion se acota para no explotar el rango.
 */
export function generateOperation(difficulty: Difficulty, rng: RNG = defaultRng): Operation {
  const params = DIFFICULTY_PARAMS[difficulty];
  const operator: Operator = pick(params.allowedOperators, rng);
  const { minOperand, maxOperand } = params;

  let a: number;
  let b: number;
  let result: number;

  switch (operator) {
    case '+': {
      a = pickInt(minOperand, maxOperand, rng);
      b = pickInt(minOperand, maxOperand, rng);
      result = a + b;
      break;
    }
    case '-': {
      a = pickInt(minOperand, maxOperand, rng);
      b = pickInt(minOperand, maxOperand, rng);
      if (b > a) [a, b] = [b, a]; // evitar negativos
      result = a - b;
      break;
    }
    case '*': {
      // Los factores se topan por params.maxMulFactor para evitar que un maxOperand
      // alto (necesario para que la suma escale) explote los productos.
      const maxFactor = Math.min(maxOperand, params.maxMulFactor);
      // El min para mul/div bajamos a 2 (no 1) para que no salga "n * 1 = n" trivial.
      const minFactor = Math.max(2, minOperand);
      a = pickInt(minFactor, maxFactor, rng);
      b = pickInt(minFactor, maxFactor, rng);
      result = a * b;
      break;
    }
    case '/': {
      // Se construye desde el cociente para garantizar entero.
      const cap = Math.min(maxOperand, params.maxDivFactor);
      const divisor = pickInt(2, cap, rng);
      const quotient = pickInt(2, cap, rng);
      a = divisor * quotient;
      b = divisor;
      result = quotient;
      break;
    }
  }

  return { a, b, operator, result };
}

/**
 * Construye 4 opciones para multichoice: la correcta + 3 distractores unicos.
 * Los distractores son cercanos al resultado pero distintos entre si.
 */
export function buildOptions(correct: number, rng: RNG = defaultRng): number[] {
  const set = new Set<number>([correct]);
  let safety = 0;
  while (set.size < 4 && safety < 50) {
    const delta = pickInt(1, 7, rng) * (rng() < 0.5 ? -1 : 1);
    const candidate = correct + delta;
    // descartar negativos para no confundir; en hard puede aparecer un negativo, lo evitamos
    if (candidate >= 0) set.add(candidate);
    safety++;
  }
  // si aun no llegamos a 4 (caso degenerado con correct chico), agregamos por arriba
  let extra = correct + 8;
  while (set.size < 4) {
    set.add(extra);
    extra++;
  }
  const options = Array.from(set);
  // mezclar
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

/**
 * Para truefalse: con probabilidad 0.5 muestra el resultado correcto,
 * con probabilidad 0.5 muestra uno cercano pero incorrecto.
 */
export function buildShownResult(correct: number, rng: RNG = defaultRng): { shown: number; isCorrect: boolean } {
  if (rng() < 0.5) return { shown: correct, isCorrect: true };
  const delta = pickInt(1, 5, rng) * (rng() < 0.5 ? -1 : 1);
  const shown = correct + delta;
  return { shown, isCorrect: shown === correct };
}

/**
 * Genera una pregunta completa para el modo y dificultad indicados.
 */
export function generateQuestion(
  mode: GameMode,
  difficulty: Difficulty,
  index: number,
  rng: RNG = defaultRng,
): Question {
  const operation = generateOperation(difficulty, rng);
  const timeLimitMs = DIFFICULTY_PARAMS[difficulty].timeLimitMs;
  const base: Question = {
    id: `q-${Date.now()}-${index}`,
    operation,
    mode,
    timeLimitMs,
  };

  if (mode === 'multichoice') {
    base.options = buildOptions(operation.result, rng);
  } else if (mode === 'truefalse') {
    const { shown, isCorrect } = buildShownResult(operation.result, rng);
    base.shownResult = shown;
    base.isShownCorrect = isCorrect;
  }
  return base;
}

/**
 * Genera una lista de preguntas para una ronda.
 * En timeattack, n se usa como tamano de buffer (se siguen generando al consumirse).
 */
export function generateRound(
  mode: GameMode,
  difficulty: Difficulty,
  n: number,
  rng: RNG = defaultRng,
): Question[] {
  const out: Question[] = [];
  for (let i = 0; i < n; i++) {
    out.push(generateQuestion(mode, difficulty, i, rng));
  }
  return out;
}
