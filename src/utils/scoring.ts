// Sistema de puntaje del enunciado:
//   - Correcta rápida (<75% del tiempo): +100
//   - Correcta dentro del tiempo:        +70
//   - Incorrecta:                        -30
//   - Sin respuesta (timeout):           -50
//
// NOTA DE DISEÑO: penalizar timeout (-50) más que incorrecta (-30) crea un
// incentivo perverso (mejor tirar cualquier cosa que dejar pasar el tiempo).
// Lo respetamos porque lo pide la consigna, pero lo mencionamos en el doc.

import { AnswerCategory, AnswerRecord, Question } from '../types/game';

export const POINTS: Record<AnswerCategory, number> = {
  fast: 100,
  ok: 70,
  wrong: -30,
  timeout: -50,
};

export const FAST_THRESHOLD_RATIO = 0.75;

/**
 * Compara el input del usuario con la respuesta correcta según el modo.
 * Devuelve boolean (correcto / incorrecto). No maneja el caso timeout (eso es null).
 */
export function isAnswerCorrect(question: Question, userAnswer: string | number | boolean): boolean {
  const correct = question.operation.result;
  switch (question.mode) {
    case 'classic':
    case 'timeattack': {
      // input puede venir como string (TextInput) o como number
      const n = typeof userAnswer === 'string' ? Number(userAnswer.trim()) : Number(userAnswer);
      return Number.isFinite(n) && n === correct;
    }
    case 'multichoice': {
      const n = typeof userAnswer === 'string' ? Number(userAnswer) : Number(userAnswer);
      return Number.isFinite(n) && n === correct;
    }
    case 'truefalse': {
      // El usuario afirma si lo MOSTRADO es correcto.
      // userAnswer (bool) tiene que coincidir con question.isShownCorrect.
      return typeof userAnswer === 'boolean' && userAnswer === question.isShownCorrect;
    }
  }
}

/**
 * Categoriza la respuesta y calcula los puntos.
 */
export function evaluateAnswer(
  question: Question,
  userAnswer: string | number | boolean | null,
  responseMs: number,
): AnswerRecord {
  // Timeout: userAnswer null o responseMs >= timeLimit
  if (userAnswer === null || responseMs >= question.timeLimitMs) {
    return {
      questionId: question.id,
      userAnswer: null,
      isCorrect: false,
      responseMs: question.timeLimitMs,
      category: 'timeout',
      points: POINTS.timeout,
    };
  }

  const correct = isAnswerCorrect(question, userAnswer);
  if (!correct) {
    return {
      questionId: question.id,
      userAnswer,
      isCorrect: false,
      responseMs,
      category: 'wrong',
      points: POINTS.wrong,
    };
  }

  // Correcta — distinguir rápida vs ok
  const fast = responseMs < question.timeLimitMs * FAST_THRESHOLD_RATIO;
  return {
    questionId: question.id,
    userAnswer,
    isCorrect: true,
    responseMs,
    category: fast ? 'fast' : 'ok',
    points: fast ? POINTS.fast : POINTS.ok,
  };
}

/**
 * Agrega un set de answers en un resumen.
 */
export function summarize(records: AnswerRecord[]): {
  score: number;
  correct: number;
  incorrect: number;
  skipped: number;
  avgResponseMs: number;
} {
  let score = 0;
  let correct = 0;
  let incorrect = 0;
  let skipped = 0;
  let totalMs = 0;
  let countedForAvg = 0;

  for (const r of records) {
    score += r.points;
    if (r.category === 'fast' || r.category === 'ok') {
      correct++;
      totalMs += r.responseMs;
      countedForAvg++;
    } else if (r.category === 'wrong') {
      incorrect++;
      totalMs += r.responseMs;
      countedForAvg++;
    } else {
      skipped++;
    }
  }

  return {
    score,
    correct,
    incorrect,
    skipped,
    avgResponseMs: countedForAvg > 0 ? Math.round(totalMs / countedForAvg) : 0,
  };
}
