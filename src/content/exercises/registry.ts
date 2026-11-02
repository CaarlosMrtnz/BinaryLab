import original from './original.json';
import { exerciseHints } from './hints';
import { type AnswerField, makeChoices } from '@/domain/answers';
import { type Base } from '@/domain/numerals';
import {
  addFixed,
  decodeBCD,
  decodeFixed,
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
  unwrap,
  type Rational,
  type SignedMode,
} from '@/domain/representations';
import { topics } from '../catalog';

function integer(
  label: string,
  expected: bigint,
  base: Base = 10,
  width?: number,
): AnswerField {
  const format = (n: bigint) =>
    (n < 0n ? '-' : '') +
    (n < 0n ? -n : n)
      .toString(base)
      .toUpperCase()
      .padStart(width ?? 0, '0');
  const candidates = [
    expected + 1n,
    expected - 1n,
    expected + 2n,
    expected + 3n,
    expected - 2n,
    expected - 3n,
    expected - 4n,
    expected ^ 1n,
    expected ^ 2n,
  ];
  const canonical = format(expected);
  const distractors = [
    ...new Set(candidates.filter((n) => expected < 0n || n >= 0n).map(format)),
  ]
    .filter(
      (s) => s !== canonical && (!width || s.replace('-', '').length === width),
    )
    .slice(0, 3);
  return {
    kind: 'integer',
    label,
    expected,
    canonical,
    base,
    width,
    instruction: `Base ${base}. ${width ? `Exactamente ${width} cifras.` : 'Se aceptan ceros iniciales.'} Escribe solo el valor, sin subíndices ni unidades.`,
    distractors,
  };
}
function pattern(
  label: string,
  expected: string,
  alphabet = /^[01]+$/,
): AnswerField {
  const canonical = expected.replace(/[\s|]/g, '').toUpperCase();
  const n = BigInt('0b' + canonical),
    mask = (1n << BigInt(canonical.length)) - 1n;
  const distractors = [n ^ 1n, n ^ 2n, n ^ mask].map((v) =>
    v.toString(2).padStart(canonical.length, '0'),
  );
  return {
    kind: 'pattern',
    label,
    expected: canonical,
    canonical,
    alphabet,
    instruction: `Exactamente ${canonical.length} bits. Se permiten espacios y | para agrupar.`,
    distractors,
  };
}
function decimal(
  label: string,
  expected: Rational,
  tolerance?: Rational,
): AnswerField {
  return {
    kind: 'rational',
    label,
    expected,
    tolerance,
    canonical: rationalDecimal(expected),
    instruction: `Decimal con coma o punto, o fracción a/b. ${tolerance ? 'Tolerancia absoluta: 0,000001.' : 'Valor exacto; sin redondeo.'}`,
    distractors: [1n, -1n, 2n].map((d) =>
      rationalDecimal(
        rational(
          expected.numerator + d * expected.denominator,
          expected.denominator,
        ),
      ),
    ),
  };
}
function concept(
  label: string,
  canonical: string,
  wrong: [string, string, string],
  aliases: string[] = [],
): AnswerField {
  return {
    kind: 'concept',
    label,
    canonical,
    accepted: [canonical, ...aliases],
    instruction:
      'Respuesta breve; se ignoran mayúsculas, tildes y puntuación final.',
    distractors: wrong,
  };
}
const signed = (n: bigint, mode: SignedMode) =>
  pattern('Patrón de 8 bits', unwrap(encodeSigned(n, 8, mode)));
const decode = (bits: string, mode: SignedMode) =>
  integer('Valor decimal', unwrap(decodeSigned(bits, mode)).value);
const bin = (n: bigint, width?: number) => integer('Binario', n, 2, width);
const dec = (n: bigint) => integer('Decimal', n);
const hex = (n: bigint) => integer('Hexadecimal', n, 16);
const oct = (n: bigint) => integer('Octal', n, 8);
const rationalField = (n: string) =>
  decimal('Valor decimal', unwrap(parseRational(n)));
const binaryFraction = (n: string) => {
  const r = unwrap(parseRational(n)),
    result = fractionToBinary(r, 32);
  // Equivalencia racional en base dos; el evaluador específico conserva el punto.
  return { r, result };
};
function binaryRational(n: string): AnswerField {
  const { r, result } = binaryFraction(n);
  return {
    kind: 'rational',
    base: 2,
    expected: r,
    label: 'Binario fraccionario',
    canonical: result.binary,
    instruction:
      'Binario con punto o coma; puedes añadir ceros iniciales o finales sin cambiar el valor.',
    distractors: ['0.1', '0.01', '1.1'],
  };
}
const specs: Record<string, AnswerField[]> = {};
function category(id: string, rows: AnswerField[][]) {
  rows.forEach((fields, i) => {
    specs[`${id}.${i + 1}`] = fields;
  });
}
category('01', [
  [integer('Patrones', 2n ** 5n), integer('Máximo', 2n ** 5n - 1n)],
  [integer('Peso mayor activo', 4n), integer('Peso menor activo', 1n), dec(5n)],
  [integer('Bytes', 32n / 8n)],
  [
    concept(
      'Paridad',
      'par',
      ['impar', 'no se puede determinar', 'ambas'],
      ['es par'],
    ),
    dec(22n),
  ],
]);
category(
  '02',
  ['10110110', '1100101', '00101101', '11100011'].map((bits) => [
    dec(BigInt('0b' + bits)),
  ]),
);
category('03', [[bin(37n)], [bin(74n)], [bin(173n, 8)], [bin(240n, 8)]]);
category('04', [
  [bin(0x2dn), dec(0x2dn)],
  [bin(0xafn), dec(0xafn)],
  [hex(0b11100101n), dec(0b11100101n)],
  [bin(0x9cn), dec(0x9cn)],
]);
category('05', [
  [dec(0o745n), bin(0o745n)],
  [dec(0o326n), bin(0o326n)],
  [oct(0b101110001n)],
  [bin(0o77n), dec(0o77n)],
]);
category('06', [
  [dec(0x3an), oct(0x3an), bin(0x3an)],
  [dec(0o157n), hex(0o157n), bin(0o157n)],
  [bin(234n), hex(234n), oct(234n)],
  [dec(0b110101111n), hex(0b110101111n), oct(0b110101111n)],
]);
category('07', [
  [bin(0b00101111n + 1n, 8)],
  [bin(0b01111111n + 1n, 8)],
  [
    pattern('Patrón almacenado', addFixed(255n, 1n, 8).bits),
    integer('Acarreo exterior', 1n),
  ],
  [bin(0b10010000n - 1n, 8)],
]);
category('08', [
  [integer('Patrones', 64n), integer('Mínimo', 0n), integer('Máximo', 63n)],
  [integer('Máximo', 2n ** 10n - 1n)],
  [integer('Bytes', 2n * 1024n), integer('Bits', 2n * 1024n * 8n)],
  [
    integer('Bytes', 1000000n),
    decimal('MiB', rational(1000000n, 1048576n), rational(1n, 1000000n)),
  ],
]);
category('09', [
  [bin(0b1011n + 0b0111n)],
  [bin(0b11100n - 0b00101n)],
  [pattern('NOT de 8 bits', (0b00110101n ^ 255n).toString(2))],
  [
    bin(16n),
    pattern('Patrón de 4 bits', '0000'),
    integer('Acarreo exterior', 1n),
  ],
]);
category('10', [
  [signed(-18n, 'magnitude')],
  [decode('10100101', 'magnitude')],
  [signed(63n, 'magnitude')],
  [
    concept(
      'Interpretación',
      'cero negativo',
      ['cero positivo', '−128', '−1'],
      ['-0', '−0', 'menos cero'],
    ),
    dec(0n),
  ],
]);
category('11', [
  [signed(-18n, 'ones')],
  [signed(-45n, 'ones')],
  [decode('11101010', 'ones')],
  [
    pattern('Resultado C1', addFixed(5n, -3n, 8, 'ones').bits),
    integer('Acarreo circular añadido', 1n),
  ],
]);
category('12', [
  [signed(-18n, 'twos')],
  [signed(-45n, 'twos')],
  [decode('11101010', 'twos')],
  [pattern('Resultado C2', addFixed(15n, -9n, 8, 'twos').bits)],
]);
category('13', [
  [
    integer('Sin signo', 240n),
    decode('11110000', 'magnitude'),
    { ...decode('11110000', 'ones'), label: 'C1' },
    { ...decode('11110000', 'twos'), label: 'C2' },
  ].map((f, i) => (i === 1 ? { ...f, label: 'Magnitud y signo' } : f)),
  [integer('Mínimo', -32n), integer('Máximo', 31n)],
  [
    concept(
      '¿Overflow?',
      'sí',
      ['no', 'solo acarreo', 'no se puede determinar'],
      ['si'],
    ),
    integer('Suma matemática', 128n),
    pattern('Patrón almacenado', addFixed(127n, 1n, 8, 'twos').bits),
  ],
  [
    concept(
      '¿Overflow?',
      'sí',
      ['no', 'solo acarreo', 'no se puede determinar'],
      ['si'],
    ),
    integer('Suma matemática', -129n),
    pattern('Patrón almacenado', addFixed(-128n, -1n, 8, 'twos').bits),
  ],
]);
category('14', [
  [pattern('BCD 8421', unwrap(encodeBCD('2084')))],
  [dec(BigInt(unwrap(decodeBCD('0011 0101 1001'))))],
  [pattern('BCD 8421', unwrap(encodeBCD('95'))), bin(95n, 8)],
  [
    concept(
      '¿BCD válido?',
      'no',
      ['sí', 'depende del signo', 'depende del ancho'],
      ['no es valido', 'invalido'],
    ),
  ],
]);
category('15', [
  [binaryRational('0.625')],
  [binaryRational('13.375')],
  [rationalField('5.375')],
  [
    pattern(
      'Seis bits tras el punto (sin 0.)',
      fractionToBinary(unwrap(parseRational('0.1')), 6).binary.split('.')[1],
    ),
  ],
]);
category('16', [
  [decimal('Valor decimal', unwrap(decodeFixed('10101100', 4)))],
  [
    pattern(
      'Patrón 4+4',
      unwrap(encodeFixed(unwrap(parseRational('2.625')), 4, 4)),
    ),
  ],
  [decimal('Resolución', rational(1n, 256n))],
  [decimal('Valor decimal', unwrap(decodeFixed('0000000110000000', 8)))],
]);
category('17', [
  [integer('Exponente real', 0b10000010n - 127n)],
  [bin(-5n + 127n, 8)],
  [bin(2n + 1023n, 11)],
  [integer('Exponente real', 0b01111101n - 127n)],
]);
category('18', [
  [pattern('Campos S | E | F (32 bits)', ieee(1).bits)],
  [pattern('Campos S | E | F (32 bits)', ieee(-2.5).bits)],
  [rationalField('2.5')],
  [
    pattern('Cero positivo (32 bits)', ieee(0).bits),
    pattern('Cero negativo (32 bits)', ieee(-0).bits),
  ],
]);
category('19', [
  [dec(BigInt('A'.charCodeAt(0))), hex(65n), bin(65n, 8)],
  [dec(BigInt('0'.charCodeAt(0))), bin(48n, 8)],
  [
    integer('Código H', 72n),
    integer('Código i', 105n),
    bin(72n, 8),
    { ...bin(105n, 8), label: 'Byte de i' },
  ].map((f, i) => (i === 2 ? { ...f, label: 'Byte de H' } : f)),
  [
    integer('Cantidad de bytes', BigInt(new TextEncoder().encode('ñ').length)),
    integer('Primer byte hex', 0xc3n, 16, 2),
    integer('Segundo byte hex', 0xb1n, 16, 2),
  ],
]);
category('20', [
  [hex(0x123456n)],
  [
    bin(0n, 8),
    { ...bin(128n, 8), label: 'Verde (byte)' },
    { ...bin(255n, 8), label: 'Azul (byte)' },
  ].map((f, i) => (i === 0 ? { ...f, label: 'Rojo (byte)' } : f)),
  [
    integer('Bytes', imageBytes(10n, 10n)),
    integer('Bits', imageBytes(10n, 10n) * 8n),
  ],
  [integer('Rojo', 255n), integer('Verde', 0n), integer('Azul', 255n)],
]);
category('21', [
  [integer('Bytes', pcmBytes(8000n, 8n, 1n, 10n).numerator)],
  [integer('Bytes', pcmBytes(44100n, 16n, 2n, 2n).numerator)],
  [integer('Bytes', pcmBytes(22050n, 16n, 1n, 1n).numerator)],
  [
    concept(
      'Compresión',
      'sin pérdida',
      ['con pérdida', 'ambas', 'ninguna'],
      [
        'sin perdida',
        'sin pérdidas',
        'compresion sin perdida',
        'compresión sin pérdidas',
        'lossless',
      ],
    ),
  ],
]);

export const exercises = original.map((record) => {
  const fields = specs[record.id];
  if (!fields) throw new Error(`Falta evaluación: ${record.id}`);
  const topic =
    topics.find((t) =>
      record.id === '21.4'
        ? t.slug === 'compresion'
        : record.categoryId === '18'
          ? t.slug === 'ieee-754'
          : t.category === record.categoryId,
    ) ?? topics[0];
  return {
    ...record,
    fields,
    choices: makeChoices(fields),
    topicSlug: topic.slug,
    rule:
      record.id === '21.4'
        ? 'Compara si el método reconstruye todos los bits o permite aproximaciones.'
        : topic.rule,
    hints: exerciseHints(record.categoryId),
    convention:
      'Responde cada parte por separado. Las etiquetas fijan base, unidades y formato. El procedimiento se muestra al comprobar o al solicitar la solución.',
  };
});
