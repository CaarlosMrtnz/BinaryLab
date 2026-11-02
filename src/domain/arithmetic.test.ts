import { describe, expect, it } from 'vitest';
import { arithmeticColumns } from './arithmetic';
describe('aritmética por columnas', () => {
  it('propaga todos los acarreos y conserva la suma completa', () => {
    const result = arithmeticColumns(255n, 1n, 8, 'add');
    expect(result).toMatchObject({
      full: 256n,
      bits: '00000000',
      carry: true,
      outOfRange: true,
    });
    expect(result.columns.every((c) => c.outgoing === 1)).toBe(true);
  });
  it('el préstamo atraviesa ceros y se distingue del resultado negativo', () => {
    const positive = arithmeticColumns(16n, 1n, 8, 'subtract');
    expect(positive).toMatchObject({
      full: 15n,
      bits: '00001111',
      borrow: false,
    });
    expect(positive.columns.slice(0, 4).every((c) => c.outgoing === 1)).toBe(
      true,
    );
    expect(arithmeticColumns(0n, 1n, 8, 'subtract')).toMatchObject({
      full: -1n,
      bits: '11111111',
      borrow: true,
      outOfRange: true,
    });
  });
  it('NOT conserva exactamente ocho posiciones', () => {
    expect(arithmeticColumns(0b00110101n, 0n, 8, 'not')).toMatchObject({
      full: 202n,
      bits: '11001010',
      carry: false,
      borrow: false,
    });
  });
  it('verifica cada columna y el resultado para todos los operandos de cuatro bits', () => {
    for (let a = 0n; a < 16n; a++)
      for (let b = 0n; b < 16n; b++)
        for (const operation of ['add', 'subtract', 'not'] as const) {
          const r = arithmeticColumns(a, b, 4, operation);
          const expected =
            operation === 'add'
              ? a + b
              : operation === 'subtract'
                ? a - b
                : 15n ^ a;
          expect(r.full).toBe(expected);
          expect(
            BigInt(
              '0b' +
                [...r.columns]
                  .reverse()
                  .map((c) => c.bit)
                  .join(''),
            ),
          ).toBe(((expected % 16n) + 16n) % 16n);
          r.columns.forEach((c, i) => {
            expect([0, 1]).toContain(c.bit);
            expect(c.incoming).toBe(i === 0 ? 0 : r.columns[i - 1].outgoing);
            if (operation === 'add')
              expect(c.a + c.b + c.incoming).toBe(2 * c.outgoing + c.bit);
            if (operation === 'subtract')
              expect(c.a - c.b - c.incoming + 2 * c.outgoing).toBe(c.bit);
          });
        }
  });
  it('rechaza operandos y anchos fuera de contrato', () => {
    expect(() => arithmeticColumns(16n, 0n, 4, 'add')).toThrow();
    expect(() => arithmeticColumns(-1n, 0n, 8, 'add')).toThrow();
    expect(() => arithmeticColumns(1n, 0n, 65, 'add')).toThrow();
  });
});
