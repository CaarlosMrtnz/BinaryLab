import { binaryWidth, parseUnsigned, type Result } from './numerals';
export type SignedMode = 'magnitude' | 'ones' | 'twos';
const failure = <T>(error: string): Result<T> => ({ ok: false, error });
export function signedRange(width: number, mode: SignedMode) {
  if (!Number.isInteger(width) || width < 2 || width > 64)
    throw new RangeError('Usa entre 2 y 64 bits.');
  const limit = 1n << BigInt(width - 1);
  return { min: mode === 'twos' ? -limit : -(limit - 1n), max: limit - 1n };
}
export function encodeSigned(
  value: bigint,
  width: number,
  mode: SignedMode,
): Result<string> {
  const range = signedRange(width, mode);
  if (value < range.min || value > range.max)
    return failure(`Fuera de rango: ${range.min}…${range.max}.`);
  const mask = (1n << BigInt(width)) - 1n;
  const magnitude = value < 0n ? -value : value;
  const encoded =
    value >= 0n
      ? value
      : mode === 'magnitude'
        ? (1n << BigInt(width - 1)) | magnitude
        : mode === 'ones'
          ? mask ^ magnitude
          : (1n << BigInt(width)) + value;
  return binaryWidth(encoded, width);
}
export function decodeSigned(
  bits: string,
  mode: SignedMode,
): Result<{ value: bigint; negativeZero: boolean }> {
  if (!/^[01]{2,64}$/.test(bits))
    return failure('Introduce un patrón de 2 a 64 bits.');
  const n = BigInt('0b' + bits),
    negative = bits[0] === '1';
  const mask = (1n << BigInt(bits.length)) - 1n;
  const value = !negative
    ? n
    : mode === 'twos'
      ? n - (1n << BigInt(bits.length))
      : mode === 'ones'
        ? -(mask ^ n)
        : -(n & (mask >> 1n));
  return {
    ok: true,
    value: { value, negativeZero: negative && value === 0n && mode !== 'twos' },
  };
}
export function addFixed(
  a: bigint,
  b: bigint,
  width: number,
  mode: 'unsigned' | 'twos' | 'ones' = 'unsigned',
) {
  const modulus = 1n << BigInt(width),
    mask = modulus - 1n;
  const min = mode === 'unsigned' ? 0n : signedRange(width, mode).min;
  const max = mode === 'unsigned' ? mask : signedRange(width, mode).max;
  if (a < min || a > max || b < min || b > max)
    throw new RangeError('Operando fuera de rango.');
  const encode = (v: bigint) =>
    mode === 'unsigned'
      ? v
      : BigInt('0b' + unwrap(encodeSigned(v, width, mode)));
  const raw = encode(a) + encode(b),
    carry = raw >= modulus;
  const stored =
    mode === 'ones' ? ((raw & mask) + (carry ? 1n : 0n)) & mask : raw & mask;
  const bits = stored.toString(2).padStart(width, '0');
  return {
    full: a + b,
    bits,
    carry,
    overflow: a + b < min || a + b > max,
    interpreted:
      mode === 'unsigned' ? stored : unwrap(decodeSigned(bits, mode)).value,
  };
}
export function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.value;
}
export function encodeBCD(digits: string): Result<string> {
  if (!/^\d{1,64}$/.test(digits))
    return failure('Introduce entre 1 y 64 cifras decimales.');
  return {
    ok: true,
    value: [...digits]
      .map((d) => BigInt(d).toString(2).padStart(4, '0'))
      .join(' '),
  };
}
export function decodeBCD(raw: string): Result<string> {
  const bits = raw.replace(/\s/g, '');
  if (!/^[01]+$/.test(bits) || bits.length % 4 || bits.length > 256)
    return failure('BCD exige grupos completos de cuatro bits.');
  const digits: string[] = [];
  for (let i = 0; i < bits.length; i += 4) {
    const n = BigInt('0b' + bits.slice(i, i + 4));
    if (n > 9n)
      return failure(`El grupo ${bits.slice(i, i + 4)} no es una cifra BCD.`);
    digits.push(n.toString());
  }
  return { ok: true, value: digits.join('') };
}
export type Rational = { numerator: bigint; denominator: bigint };
export function gcd(a: bigint, b: bigint): bigint {
  while (b) [a, b] = [b, a % b];
  return a < 0n ? -a : a;
}
export function rational(numerator: bigint, denominator: bigint): Rational {
  if (denominator === 0n) throw new RangeError('División entre cero.');
  const d = gcd(numerator, denominator),
    sign = denominator < 0n ? -1n : 1n;
  return {
    numerator: (numerator / d) * sign,
    denominator: (denominator / d) * sign,
  };
}
export function parseRational(
  raw: string,
  base: 2 | 10 = 10,
): Result<Rational> {
  const text = raw.trim().replace(',', '.').replace('−', '-');
  if (text.length > 256) return failure('Límite de 256 caracteres.');
  if (base === 10 && /^[+-]?\d+\/\d+$/.test(text)) {
    const [a, b] = text.split('/').map(BigInt);
    return b === 0n
      ? failure('División entre cero.')
      : { ok: true, value: rational(a, b) };
  }
  const pattern =
    base === 2 ? /^[+-]?[01]+(?:\.[01]+)?$/ : /^[+-]?\d+(?:\.\d+)?$/;
  if (!pattern.test(text))
    return failure(
      `Escribe un número en base ${base}; usa coma o punto como separador.`,
    );
  const negative = text.startsWith('-');
  const unsigned = text.replace(/^[+-]/, ''),
    [whole, fraction = ''] = unsigned.split('.');
  const n = unwrap(parseUnsigned(whole + fraction, base));
  return {
    ok: true,
    value: rational(negative ? -n : n, BigInt(base) ** BigInt(fraction.length)),
  };
}
export function fractionToBinary(r: Rational, precision = 16) {
  if (
    !Number.isInteger(precision) ||
    precision < 1 ||
    precision > 64 ||
    r.denominator <= 0n
  )
    throw new RangeError('Precisión o fracción no válida.');
  const absolute = r.numerator < 0n ? -r.numerator : r.numerator;
  const whole = absolute / r.denominator;
  let remainder = absolute % r.denominator,
    digits = '';
  const seen = new Map<bigint, number>(),
    steps: string[] = [];
  let repeatAt: number | null = null;
  for (let i = 0; i < precision && remainder; i++) {
    if (seen.has(remainder) && repeatAt === null)
      repeatAt = seen.get(remainder)!;
    seen.set(remainder, seen.get(remainder) ?? i);
    const doubled = remainder * 2n,
      bit = doubled / r.denominator;
    steps.push(
      `${remainder}/${r.denominator} × 2 = ${doubled}/${r.denominator} → bit ${bit}; resto ${doubled % r.denominator}/${r.denominator}`,
    );
    digits += bit;
    remainder = doubled % r.denominator;
  }
  return {
    binary: `${r.numerator < 0n ? '-' : ''}${whole.toString(2)}${digits ? '.' + digits : ''}`,
    exact: remainder === 0n,
    repeatAt,
    steps,
    remainder,
  };
}
export function rationalDecimal(r: Rational): string {
  const sign = r.numerator < 0n ? '-' : '',
    n = r.numerator < 0n ? -r.numerator : r.numerator;
  let rem = n % r.denominator,
    digits = '';
  for (let i = 0; i < 64 && rem; i++) {
    rem *= 10n;
    digits += rem / r.denominator;
    rem %= r.denominator;
  }
  return `${sign}${n / r.denominator}${digits ? '.' + digits : ''}${rem ? '…' : ''}`;
}
export function encodeFixed(
  r: Rational,
  integerBits: number,
  fractionBits: number,
): Result<string> {
  if (
    r.numerator < 0n ||
    integerBits < 1 ||
    fractionBits < 0 ||
    integerBits + fractionBits > 64
  )
    return failure('Formato fijo sin signo no válido.');
  const scaled = r.numerator * (1n << BigInt(fractionBits));
  if (scaled % r.denominator)
    return failure(
      'No es exacto con esta precisión; no se redondea silenciosamente.',
    );
  return binaryWidth(scaled / r.denominator, integerBits + fractionBits);
}
export function decodeFixed(
  bits: string,
  fractionBits: number,
): Result<Rational> {
  if (
    !/^[01]{1,64}$/.test(bits) ||
    !Number.isInteger(fractionBits) ||
    fractionBits < 0 ||
    fractionBits > bits.length
  )
    return failure('Patrón o posición de punto no válidos.');
  return {
    ok: true,
    value: rational(BigInt('0b' + bits), 1n << BigInt(fractionBits)),
  };
}
export function ieee(value: number, width: 32 | 64 = 32) {
  const buffer = new ArrayBuffer(width / 8),
    view = new DataView(buffer);
  if (width === 32) view.setFloat32(0, value, false);
  else view.setFloat64(0, value, false);
  const bytes = Array.from(new Uint8Array(buffer));
  const bits = bytes.map((v) => v.toString(2).padStart(8, '0')).join('');
  const exponentSize = width === 32 ? 8 : 11,
    bias = width === 32 ? 127 : 1023;
  const sign = bits[0],
    exponent = bits.slice(1, 1 + exponentSize),
    fraction = bits.slice(1 + exponentSize);
  const e = Number.parseInt(exponent, 2),
    f = BigInt('0b' + fraction),
    max = 2 ** exponentSize - 1;
  const kind =
    e === max
      ? f
        ? 'NaN'
        : 'infinito'
      : e === 0
        ? f
          ? 'subnormal'
          : 'cero'
        : 'normal';
  return {
    bits,
    hex: bytes
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase(),
    sign,
    exponent,
    fraction,
    bias,
    storedExponent: e,
    realExponent: e === 0 ? 1 - bias : e - bias,
    kind,
    stored:
      width === 32 ? view.getFloat32(0, false) : view.getFloat64(0, false),
  };
}
export function decodeIEEE(bits: string): Result<number> {
  if (!/^[01]+$/.test(bits) || (bits.length !== 32 && bits.length !== 64))
    return failure('IEEE exige 32 o 64 bits.');
  const view = new DataView(new ArrayBuffer(bits.length / 8));
  for (let i = 0; i < bits.length; i += 8)
    view.setUint8(i / 8, Number.parseInt(bits.slice(i, i + 8), 2));
  return {
    ok: true,
    value:
      bits.length === 32
        ? view.getFloat32(0, false)
        : view.getFloat64(0, false),
  };
}
export function rgbHex(r: number, g: number, b: number): string {
  if (![r, g, b].every((v) => Number.isInteger(v) && v >= 0 && v <= 255))
    throw new RangeError('Cada canal debe estar entre 0 y 255.');
  return (
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}
export const imageBytes = (width: bigint, height: bigint) =>
  width * height * 3n;
export const pcmBytes = (
  rate: bigint,
  depth: bigint,
  channels: bigint,
  seconds: bigint,
) => rational(rate * depth * channels * seconds, 8n);
