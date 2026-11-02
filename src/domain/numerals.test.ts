import { describe, expect, it } from 'vitest';
import {
  BASES,
  binaryWidth,
  conversion,
  formatUnsigned,
  groupBits,
  parseUnsigned,
  requiredBits,
} from './numerals';
import { unwrap } from './representations';

describe('enteros exactos y contratos N01–N13', () => {
  it.each([
    ['10010101', 2, 149n],
    ['A5', 16, 165n],
    ['1995', 10, 1995n],
    ['563', 8, 371n],
    ['563', 16, 1379n],
    ['573', 8, 379n],
    ['573', 16, 1395n],
    ['0', 2, 0n],
    ['a', 16, 10n],
  ] as const)('%s en base %i', (text, base, value) =>
    expect(unwrap(parseUnsigned(text, base))).toBe(value),
  );
  it('comprueba las cuatro equivalencias de referencia', () => {
    expect(BASES.map((b) => formatUnsigned(149n, b))).toEqual([
      '10010101',
      '149',
      '95',
      '225',
    ]);
    expect(BASES.map((b) => formatUnsigned(165n, b))).toEqual([
      '10100101',
      '165',
      'A5',
      '245',
    ]);
    expect(BASES.map((b) => formatUnsigned(1995n, b))).toEqual([
      '11111001011',
      '1995',
      '7CB',
      '3713',
    ]);
  });
  it.each([
    ['102', 2],
    ['89', 8],
    ['G', 16],
    ['-1', 10],
    ['1e3', 10],
    ['1 0', 2],
    ['0xFF', 16],
  ] as const)('rechaza todo %s', (text, base) =>
    expect(parseUnsigned(text, base).ok).toBe(false),
  );
  it('vacío, longitud, cero y ancho insuficiente', () => {
    expect(parseUnsigned('', 2).ok).toBe(false);
    expect(parseUnsigned('1'.repeat(257), 2).ok).toBe(false);
    expect(requiredBits(0n)).toBe(1);
    expect(unwrap(binaryWidth(0n, 8))).toBe('00000000');
    expect(binaryWidth(149n, 4).ok).toBe(false);
    expect(binaryWidth(1n, -1).ok).toBe(false);
    expect(unwrap(binaryWidth(149n, 8))).toBe('10010101');
    expect(() => formatUnsigned(-1n, 10)).toThrow();
  });
  it('recorre bases y enteros más allá del rango seguro', () => {
    for (const n of [
      0n,
      1n,
      149n,
      2n ** 53n + 1n,
      2n ** 64n - 1n,
      2n ** 128n + 123456789n,
      10n ** 200n,
    ]) {
      for (const from of BASES)
        for (const to of BASES) {
          const formatted = formatUnsigned(n, from);
          if (formatted.length <= 256)
            expect(unwrap(parseUnsigned(formatted, from))).toBe(n);
          const c = conversion(n, from, to);
          expect(c.result).toBe(n.toString(to).toUpperCase());
          expect(c.steps.length).toBeLessThanOrEqual(129);
        }
    }
  });
  it('los procedimientos usan operaciones reales', () => {
    const positions = conversion(149n, 2, 10);
    expect(
      positions.steps
        .slice(0, -1)
        .reduce((sum, s) => sum + BigInt(s.result), 0n),
    ).toBe(149n);
    expect(conversion(149n, 10, 2).steps[0]).toEqual({
      text: '149 ÷ 2 = 74',
      result: 'resto 1',
    });
    expect(conversion(149n, 2, 16).steps[0]).toEqual({
      text: '1001₂',
      result: '9₁₆',
    });
    expect(groupBits('11111001011', 3)).toEqual(['011', '111', '001', '011']);
    expect(() => groupBits('1', 0)).toThrow();
  });
});
