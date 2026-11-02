export type BinaryOperation = 'add' | 'subtract' | 'not';
export type BinaryColumn = {
  position: number;
  a: number;
  b: number;
  incoming: number;
  outgoing: number;
  bit: number;
};

/** Columnas desde el LSB al MSB; el resultado completo nunca se trunca. */
export function arithmeticColumns(
  a: bigint,
  b: bigint,
  width: number,
  operation: BinaryOperation,
) {
  if (!Number.isInteger(width) || width < 1 || width > 64)
    throw new RangeError('Usa de 1 a 64 bits.');
  const modulus = 1n << BigInt(width),
    mask = modulus - 1n;
  if (a < 0n || a > mask || b < 0n || b > mask)
    throw new RangeError('Operando fuera del ancho sin signo.');
  const full =
    operation === 'add' ? a + b : operation === 'subtract' ? a - b : mask ^ a;
  const columns: BinaryColumn[] = [];
  let incoming = 0;
  for (let position = 0; position < width; position++) {
    const left = Number((a >> BigInt(position)) & 1n),
      right = Number((b >> BigInt(position)) & 1n);
    const raw =
      operation === 'add'
        ? left + right + incoming
        : operation === 'subtract'
          ? left - right - incoming
          : 1 - left;
    const outgoing =
      operation === 'add'
        ? Number(raw >= 2)
        : operation === 'subtract'
          ? Number(raw < 0)
          : 0;
    const bit =
      operation === 'subtract'
        ? raw + 2 * outgoing
        : operation === 'add'
          ? raw - 2 * outgoing
          : raw;
    columns.push({ position, a: left, b: right, incoming, outgoing, bit });
    incoming = outgoing;
  }
  return {
    full,
    bits: (((full % modulus) + modulus) % modulus)
      .toString(2)
      .padStart(width, '0'),
    columns,
    carry: operation === 'add' && incoming === 1,
    borrow: operation === 'subtract' && incoming === 1,
    outOfRange: full < 0n || full > mask,
  };
}
