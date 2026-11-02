import { parseUnsigned, type Base, type Result } from './numerals';
import { parseRational, rational, type Rational } from './representations';

type Common = {
  label: string;
  canonical: string;
  instruction: string;
  distractors: string[];
};
export type AnswerField = Common &
  (
    | { kind: 'integer'; base: Base; expected: bigint; width?: number }
    | {
        kind: 'rational';
        expected: Rational;
        tolerance?: Rational;
        base?: 2 | 10;
      }
    | { kind: 'pattern'; expected: string; alphabet: RegExp }
    | { kind: 'concept'; accepted: string[] }
  );
export type Evaluation = {
  status: 'correct' | 'incorrect' | 'format' | 'empty';
  message: string;
};
export const normalizeConcept = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[−–]/g, '-')
    .replace(/[.!?]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function readInteger(
  raw: string,
  field: Extract<AnswerField, { kind: 'integer' }>,
): Result<bigint> {
  const compact = raw
    .trim()
    .replace(/\s/g, '')
    .replace('−', '-')
    .replace(/^#/, field.base === 16 ? '' : '#');
  const unsigned = compact.replace(/^[+-]/, '');
  if (field.base !== 10 && /^[+-]/.test(compact))
    return { ok: false, error: 'Escribe un patrón sin signo explícito.' };
  if (field.width && unsigned.length !== field.width)
    return {
      ok: false,
      error: `Se requieren exactamente ${field.width} cifras, sin contar separadores.`,
    };
  const parsed = parseUnsigned(unsigned, field.base);
  return parsed.ok
    ? {
        ok: true,
        value: compact.startsWith('-') ? -parsed.value : parsed.value,
      }
    : parsed;
}
export function evaluateField(field: AnswerField, raw: string): Evaluation {
  if (!raw.trim())
    return {
      status: 'empty',
      message: 'Escribe una respuesta antes de comprobar.',
    };
  if (raw.length > 512)
    return { status: 'format', message: 'Usa como máximo 512 caracteres.' };
  let correct: boolean;
  if (field.kind === 'integer') {
    const result = readInteger(raw, field);
    if (!result.ok) return { status: 'format', message: result.error };
    correct = result.value === field.expected;
  } else if (field.kind === 'rational') {
    const result = parseRational(raw, field.base ?? 10);
    if (!result.ok) return { status: 'format', message: result.error };
    const difference =
      result.value.numerator * field.expected.denominator -
      field.expected.numerator * result.value.denominator;
    const absolute = difference < 0n ? -difference : difference;
    const tolerance = field.tolerance ?? rational(0n, 1n);
    correct =
      absolute * tolerance.denominator <=
      tolerance.numerator *
        result.value.denominator *
        field.expected.denominator;
  } else if (field.kind === 'pattern') {
    const compact = raw.replace(/[\s|]/g, '').toUpperCase();
    if (
      !field.alphabet.test(compact) ||
      compact.length !== field.expected.length
    )
      return { status: 'format', message: field.instruction };
    correct = compact === field.expected;
  } else
    correct = field.accepted.some(
      (s) => normalizeConcept(s) === normalizeConcept(raw),
    );
  return correct
    ? { status: 'correct', message: 'Correcto.' }
    : {
        status: 'incorrect',
        message: 'No es correcto. Revisa la regla y el procedimiento.',
      };
}
export function evaluateAnswers(
  fields: AnswerField[],
  values: string[],
): Evaluation {
  const results = fields.map((field, i) =>
    evaluateField(field, values[i] ?? ''),
  );
  return (
    results.find((r) => r.status === 'empty') ??
    results.find((r) => r.status === 'format') ??
    results.find((r) => r.status === 'incorrect') ?? {
      status: 'correct',
      message: 'Correcto.',
    }
  );
}
export type Choice = { id: string; values: string[]; label: string };
export function makeChoices(fields: AnswerField[]): Choice[] {
  const answers = fields.map((f) => f.canonical);
  const alternatives = fields.map((field) => {
    const wrong = [...new Set(field.distractors)].filter(
      (value) => evaluateField(field, value).status === 'incorrect',
    );
    if (wrong.length < 3)
      throw new Error('Faltan tres distractores válidos para cada parte.');
    return wrong;
  });
  // Cada opción es una respuesta completa. Ninguna columna regala su valor
  // correcto en todas las alternativas ni lo repite como pista por frecuencia.
  const choices = [
    answers,
    ...[0, 1, 2].map((index) => alternatives.map((values) => values[index])),
  ].map((values, index) => ({
    id: String(index),
    values,
    label: fields.map((field, i) => `${field.label}: ${values[i]}`).join(' · '),
  }));
  if (
    choices.length !== 4 ||
    choices.filter(
      (c) => evaluateAnswers(fields, c.values).status === 'correct',
    ).length !== 1
  )
    throw new Error('Alternativas ambiguas: revisa el ejercicio.');
  return choices;
}
