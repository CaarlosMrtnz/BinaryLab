export type Base = 2 | 8 | 10 | 16;
export type Width = 'auto' | 4 | 8 | 16 | 32 | 64;
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
export const BASES: readonly Base[] = [2, 10, 16, 8];
export const BASE_NAMES: Record<Base, string> = {
  2: 'Binario',
  8: 'Octal',
  10: 'Decimal',
  16: 'Hexadecimal',
};
export const SUBS: Record<Base, string> = {
  2: '₂',
  8: '₈',
  10: '₁₀',
  16: '₁₆',
};
export const MAX_DIGITS = 256;
const patterns: Record<Base, RegExp> = {
  2: /^[01]+$/,
  8: /^[0-7]+$/,
  10: /^[0-9]+$/,
  16: /^[0-9a-f]+$/i,
};
export const validDigits = (raw: string, base: Base) =>
  raw === '' || patterns[base].test(raw);
export function parseUnsigned(
  raw: string,
  base: Base,
  maxDigits = MAX_DIGITS,
): Result<bigint> {
  if (!raw) return { ok: false, error: 'Introduce un número para comenzar.' };
  if (raw.length > maxDigits)
    return {
      ok: false,
      error: `El límite de edición es ${maxDigits} cifras.`,
    };
  if (!patterns[base].test(raw))
    return { ok: false, error: `Cifras no válidas en base ${base}.` };
  let value = 0n;
  for (const digit of raw.toUpperCase())
    value = value * BigInt(base) + BigInt('0123456789ABCDEF'.indexOf(digit));
  return { ok: true, value };
}
export function formatUnsigned(value: bigint, base: Base): string {
  if (value < 0n) throw new RangeError('El entero debe ser no negativo.');
  return value.toString(base).toUpperCase();
}
export const requiredBits = (value: bigint) => formatUnsigned(value, 2).length;
export function binaryWidth(value: bigint, width: number): Result<string> {
  if (!Number.isInteger(width) || width < 1 || width > 1024)
    return { ok: false, error: 'Ancho no válido.' };
  const bits = formatUnsigned(value, 2);
  return bits.length > width
    ? {
        ok: false,
        error: `El valor necesita ${bits.length} bits y no cabe en ${width}. Amplía el ancho.`,
      }
    : { ok: true, value: bits.padStart(width, '0') };
}
export function groupBits(bits: string, size: number): string[] {
  if (!Number.isInteger(size) || size < 1)
    throw new RangeError('Grupo no válido.');
  const padded = bits.padStart(Math.ceil(bits.length / size) * size, '0');
  return Array.from({ length: padded.length / size }, (_, i) =>
    padded.slice(i * size, (i + 1) * size),
  );
}
export type Step = { text: string; result: string };
export type Conversion = {
  method: string;
  explanation: string;
  formula: string;
  steps: Step[];
  result: string;
  summarized: boolean;
};
export function conversion(value: bigint, from: Base, to: Base): Conversion {
  const input = formatUnsigned(value, from),
    result = formatUnsigned(value, to);
  const steps: Step[] = [];
  let method: string, explanation: string, formula: string;
  if (from === to) {
    method = 'Identidad';
    explanation =
      'La base de origen y destino es la misma. El valor no cambia.';
    formula = 'valor de salida = valor de entrada';
    steps.push({
      text: `${input}${SUBS[from]}`,
      result: `${result}${SUBS[to]}`,
    });
  } else if (to === 10) {
    method = 'Suma de pesos';
    explanation = `Cada cifra multiplica una potencia de ${from}. La posición cero está a la derecha.`;
    formula =
      'N = Σ dᵢ × Bⁱ; dᵢ: cifra, B: base, i: posición desde la derecha.';
    [...input].forEach((d, i) => {
      const position = input.length - i - 1;
      const weight = BigInt(from) ** BigInt(position);
      const digit = BigInt('0123456789ABCDEF'.indexOf(d));
      steps.push({
        text: `${d} × ${from}^${position}`,
        result: `${digit * weight}`,
      });
    });
    steps.push({ text: 'Suma de todas las contribuciones', result });
  } else if (
    (from === 2 && (to === 8 || to === 16)) ||
    (to === 2 && (from === 8 || from === 16))
  ) {
    const groupBase = from === 2 ? to : from;
    const size = groupBase === 16 ? 4 : 3;
    method = `Agrupaciones de ${size} bits`;
    explanation = `Como ${groupBase} = 2^${size}, cada cifra equivale a ${size} bits. Se completa con ceros a la izquierda para agrupar; el valor no cambia.`;
    formula = `${groupBase} = 2^${size}; un grupo de ${size} bits ↔ una cifra en base ${groupBase}.`;
    const groups =
      from === 2
        ? groupBits(value.toString(2), size)
        : [...input].map((d) =>
            BigInt('0123456789ABCDEF'.indexOf(d))
              .toString(2)
              .padStart(size, '0'),
          );
    groups.forEach((g) =>
      steps.push({
        text: `${g}₂`,
        result: `${BigInt('0b' + g)
          .toString(groupBase)
          .toUpperCase()}${SUBS[groupBase]}`,
      }),
    );
    steps.push({
      text: 'Leer los grupos de izquierda a derecha',
      result: `${result}${SUBS[to]}`,
    });
  } else {
    method = 'Divisiones sucesivas';
    explanation = `Primero se obtiene el valor decimal exacto. Se divide entre ${to} y se leen los restos de abajo arriba.`;
    formula =
      'n = B × q + r, 0 ≤ r < B; B: base destino, q: cociente entero, r: resto.';
    if (from !== 10)
      steps.push({
        text: `Valor posicional de ${input}${SUBS[from]}`,
        result: `${value}₁₀`,
      });
    let n = value;
    do {
      const q = n / BigInt(to),
        r = n % BigInt(to);
      steps.push({
        text: `${n} ÷ ${to} = ${q}`,
        result: `resto ${r.toString(to).toUpperCase()}`,
      });
      n = q;
    } while (n > 0n);
    steps.push({
      text: 'Restos de abajo arriba',
      result: `${result}${SUBS[to]}`,
    });
  }
  const summarized = steps.length > 128;
  return {
    method,
    explanation,
    formula,
    steps: summarized
      ? [
          ...steps.slice(0, 64),
          {
            text: `${steps.length - 128} pasos intermedios omitidos en esta vista`,
            result: 'Valor íntegro conservado',
          },
          ...steps.slice(-64),
        ]
      : steps,
    result,
    summarized,
  };
}
