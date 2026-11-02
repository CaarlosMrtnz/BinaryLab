import { describe, expect, it } from 'vitest';
import {
  addFixed,
  decodeBCD,
  decodeFixed,
  decodeIEEE,
  decodeSigned,
  encodeBCD,
  encodeFixed,
  encodeSigned,
  fractionToBinary,
  ieee,
  imageBytes,
  parseRational,
  pcmBytes,
  rational,
  rationalDecimal,
  rgbHex,
  signedRange,
  unwrap,
  type SignedMode,
} from './representations';
describe('signo y aritmética N14–N18', () => {
  it('interpretación de 10000011 y codificación de −59', () => {
    expect(
      ['magnitude', 'ones', 'twos'].map(
        (m) => unwrap(decodeSigned('10000011', m as SignedMode)).value,
      ),
    ).toEqual([-3n, -124n, -125n]);
    expect(
      ['magnitude', 'ones', 'twos'].map((m) =>
        unwrap(encodeSigned(-59n, 8, m as SignedMode)),
      ),
    ).toEqual(['10111011', '11000100', '11000101']);
  });
  it('desbordamiento no se confunde con acarreo', () => {
    expect(addFixed(127n, 1n, 8, 'twos')).toMatchObject({
      full: 128n,
      bits: '10000000',
      overflow: true,
      carry: false,
      interpreted: -128n,
    });
    expect(addFixed(255n, 1n, 8)).toMatchObject({
      full: 256n,
      bits: '00000000',
      carry: true,
      overflow: true,
    });
    expect(addFixed(-128n, -1n, 8, 'twos')).toMatchObject({
      bits: '01111111',
      overflow: true,
    });
    expect(addFixed(5n, -3n, 8, 'ones')).toMatchObject({
      bits: '00000010',
      interpreted: 2n,
      carry: true,
    });
    expect(addFixed(13n, -6n, 8, 'ones').interpreted).toBe(7n);
    expect(addFixed(15n, -9n, 8, 'twos').interpreted).toBe(6n);
    expect(() => addFixed(256n, 1n, 8)).toThrow();
  });
  it('ceros negativos y rangos', () => {
    expect(unwrap(decodeSigned('11111111', 'ones'))).toEqual({
      value: 0n,
      negativeZero: true,
    });
    expect(unwrap(decodeSigned('10000000', 'magnitude')).negativeZero).toBe(
      true,
    );
    expect(unwrap(decodeSigned('10000000', 'twos')).value).toBe(-128n);
    expect(encodeSigned(128n, 8, 'twos').ok).toBe(false);
    expect(encodeSigned(-128n, 8, 'ones').ok).toBe(false);
    expect(encodeSigned(127n, 8, 'magnitude').ok).toBe(true);
    expect(decodeSigned('102', 'twos').ok).toBe(false);
    expect(() => signedRange(1, 'twos')).toThrow();
  });
  it('recorre exhaustivamente 4 y 8 bits en tres formatos', () => {
    for (const width of [4, 8])
      for (const mode of ['magnitude', 'ones', 'twos'] as const) {
        const { min, max } = signedRange(width, mode);
        for (let value = min; value <= max; value++)
          expect(
            unwrap(decodeSigned(unwrap(encodeSigned(value, width, mode)), mode))
              .value,
          ).toBe(value);
      }
  });
});
describe('BCD, fracciones y punto fijo N19–N22', () => {
  it('BCD por cifras con ceros y rechazo por grupo', () => {
    expect(unwrap(encodeBCD('6749'))).toBe('0110 0111 0100 1001');
    expect(unwrap(decodeBCD(unwrap(encodeBCD('000395'))))).toBe('000395');
    for (const s of ['1010', '001', '2', ''])
      expect(decodeBCD(s).ok).toBe(false);
    expect(encodeBCD('A').ok).toBe(false);
  });
  it('fracciones exactas, periódicas y truncadas', () => {
    expect(fractionToBinary(unwrap(parseRational('0,375')))).toMatchObject({
      binary: '0.011',
      exact: true,
    });
    expect(fractionToBinary(unwrap(parseRational('0.2')), 12)).toMatchObject({
      binary: '0.001100110011',
      exact: false,
      repeatAt: 0,
    });
    expect(fractionToBinary(unwrap(parseRational('0.1')), 6).binary).toBe(
      '0.000110',
    );
    expect(fractionToBinary(unwrap(parseRational('-13.375'))).binary).toBe(
      '-1101.011',
    );
    expect(rationalDecimal(unwrap(parseRational('101.011', 2)))).toBe('5.375');
    expect(rationalDecimal(rational(1n, 3n))).toContain('…');
    expect(rational(1n, -2n)).toEqual({ numerator: -1n, denominator: 2n });
    expect(parseRational('1/0').ok).toBe(false);
    expect(parseRational('1e2').ok).toBe(false);
    expect(parseRational('1'.repeat(257)).ok).toBe(false);
    expect(unwrap(parseRational('1/256'))).toEqual({
      numerator: 1n,
      denominator: 256n,
    });
    expect(() => rational(1n, 0n)).toThrow();
    expect(() => fractionToBinary(rational(1n, 2n), 0)).toThrow();
  });
  it('punto fijo y resolución sin redondeo silencioso', () => {
    expect(rationalDecimal(unwrap(decodeFixed('0110010100010101', 8)))).toBe(
      '101.08203125',
    );
    expect(rationalDecimal(unwrap(decodeFixed('10101100', 4)))).toBe('10.75');
    expect(unwrap(encodeFixed(unwrap(parseRational('2.625')), 4, 4))).toBe(
      '00101010',
    );
    expect(encodeFixed(unwrap(parseRational('0.1')), 4, 4).ok).toBe(false);
    expect(encodeFixed(rational(-1n, 1n), 4, 4).ok).toBe(false);
    expect(decodeFixed('2', 1).ok).toBe(false);
  });
});
describe('IEEE real e información N23–N26', () => {
  it('el ejemplo −19,6875 reconstruye exactamente los campos de ambos formatos', () => {
    for (const [width, hex, exponent] of [
      [32, 'C19D8000', '10000011'],
      [64, 'C033B00000000000', '10000000011'],
    ] as const) {
      const value = ieee(-315 / 16, width);
      expect(value.hex).toBe(hex);
      expect(value.sign).toBe('1');
      expect(value.exponent).toBe(exponent);
      expect(value.fraction).toBe(
        '00111011' + '0'.repeat(width === 32 ? 15 : 44),
      );
      expect(value.realExponent).toBe(4);
      expect(value.kind).toBe('normal');
      expect(value.stored).toBe(-19.6875);
      expect(unwrap(decodeIEEE(value.bits))).toBe(-315 / 16);
    }
  });
  it('patrones reales de referencia y descomposición', () => {
    expect(ieee(-148.421875).hex).toBe('C3146C00');
    expect(ieee(-148.421875).bits).toBe('11000011000101000110110000000000');
    expect(ieee(1).hex).toBe('3F800000');
    expect(ieee(-2.5).hex).toBe('C0200000');
    expect(unwrap(decodeIEEE(ieee(2.5).bits))).toBe(2.5);
    expect(ieee(0.2).stored).not.toBe(0.2);
    expect(ieee(0.2, 64).stored).toBe(0.2);
    expect(ieee(2 ** -149).kind).toBe('subnormal');
    for (const width of [32, 64] as const) {
      expect(ieee(0, width).kind).toBe('cero');
      expect(ieee(-0, width).sign).toBe('1');
      expect(ieee(Infinity, width).kind).toBe('infinito');
      expect(ieee(-Infinity, width).sign).toBe('1');
      expect(ieee(NaN, width).kind).toBe('NaN');
      expect(Object.is(unwrap(decodeIEEE(ieee(-0, width).bits)), -0)).toBe(
        true,
      );
      expect(Number.isNaN(unwrap(decodeIEEE(ieee(NaN, width).bits)))).toBe(
        true,
      );
    }
    expect(decodeIEEE('00').ok).toBe(false);
  });
  it('ASCII, UTF-8, RGB, imagen y PCM', () => {
    expect('h'.charCodeAt(0)).toBe(104);
    expect([...new TextEncoder().encode('ñ')]).toEqual([195, 177]);
    expect(rgbHex(255, 0, 0)).toBe('#FF0000');
    expect(() => rgbHex(256, 0, 0)).toThrow();
    expect(imageBytes(1280n, 1024n)).toBe(3932160n);
    expect(3932160 / 2 ** 20).toBe(3.75);
    expect(pcmBytes(44100n, 16n, 2n, 2n)).toEqual({
      numerator: 352800n,
      denominator: 1n,
    });
    expect(() => unwrap({ ok: false, error: 'fallo esperado' })).toThrow(
      'fallo esperado',
    );
  });
});
