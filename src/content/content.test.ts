import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import reviewed from './reviewed-content-manifest.json';
import { describe, expect, it } from 'vitest';
import { categories, groups, topics } from './catalog';
import { exercises } from './exercises/registry';
import { evaluateAnswers, evaluateField } from '@/domain/answers';

// Oráculo editorial independiente: valores/patrones cotejados con las 84 soluciones académicas.
const verified = [
  ['32', '31'],
  ['4', '1', '5'],
  ['4'],
  ['par', '22'],
  ['182'],
  ['101'],
  ['45'],
  ['227'],
  ['100101'],
  ['1001010'],
  ['10101101'],
  ['11110000'],
  ['101101', '45'],
  ['10101111', '175'],
  ['E5', '229'],
  ['10011100', '156'],
  ['485', '111100101'],
  ['214', '11010110'],
  ['561'],
  ['111111', '63'],
  ['58', '72', '111010'],
  ['111', '6F', '1101111'],
  ['11101010', 'EA', '352'],
  ['431', '1AF', '657'],
  ['00110000'],
  ['10000000'],
  ['00000000', '1'],
  ['10001111'],
  ['64', '0', '63'],
  ['1023'],
  ['2048', '16384'],
  ['1000000', '0.95367431640625'],
  ['10010'],
  ['10111'],
  ['11001010'],
  ['10000', '0000', '1'],
  ['10010010'],
  ['-37'],
  ['00111111'],
  ['cero negativo', '0'],
  ['11101101'],
  ['11010010'],
  ['-21'],
  ['00000010', '1'],
  ['11101110'],
  ['11010011'],
  ['-22'],
  ['00000110'],
  ['240', '-112', '-15', '-16'],
  ['-32', '31'],
  ['sí', '128', '10000000'],
  ['sí', '-129', '01111111'],
  ['0010000010000100'],
  ['359'],
  ['10010101', '01011111'],
  ['no'],
  ['0.101'],
  ['1101.011'],
  ['5.375'],
  ['000110'],
  ['10.75'],
  ['00101010'],
  ['0.00390625'],
  ['1.5'],
  ['3'],
  ['01111010'],
  ['10000000001'],
  ['-2'],
  ['00111111100000000000000000000000'],
  ['11000000001000000000000000000000'],
  ['2.5'],
  ['00000000000000000000000000000000', '10000000000000000000000000000000'],
  ['65', '41', '01000001'],
  ['48', '00110000'],
  ['72', '105', '01001000', '01101001'],
  ['2', 'C3', 'B1'],
  ['123456'],
  ['00000000', '10000000', '11111111'],
  ['300', '2400'],
  ['255', '0', '255'],
  ['80000'],
  ['352800'],
  ['44100'],
  ['sin pérdida'],
];
describe('cobertura e integridad de contenidos', () => {
  it('los 34 ejercicios de varias partes no regalan campos secundarios en las opciones', () => {
    const multiple = exercises.filter((exercise) => exercise.fields.length > 1);
    expect(multiple).toHaveLength(34);
    for (const exercise of multiple) {
      exercise.fields.forEach((field, index) => {
        const candidates = exercise.choices.map(
          (choice) => choice.values[index],
        );
        expect(new Set(candidates).size, `${exercise.id}: ${field.label}`).toBe(
          4,
        );
        expect(
          candidates.map((value) => evaluateField(field, value).status).sort(),
        ).toEqual(['correct', 'incorrect', 'incorrect', 'incorrect']);
      });
    }
  });
  it('21.4 admite sin pérdida y sin pérdidas como el mismo concepto', () => {
    const field = exercises.find((exercise) => exercise.id === '21.4')!
      .fields[0];
    for (const answer of [
      'sin pérdida',
      'sin pérdidas',
      '  SIN   PÉRDIDAS! ',
      'Compresión sin pérdidas.',
      'compresion sin perdida',
      'lossless',
    ]) {
      expect(evaluateField(field, answer).status, answer).toBe('correct');
    }
  });
  it('21.4 rechaza conceptos contrarios, incompletos o ambiguos', () => {
    const field = exercises.find((exercise) => exercise.id === '21.4')!
      .fields[0];
    for (const answer of [
      'con pérdidas',
      'pérdidas',
      'sin',
      'ambas',
      'sin pérdidas o con pérdidas',
      'no es sin pérdidas',
    ]) {
      expect(evaluateField(field, answer).status, answer).toBe('incorrect');
    }
  });
  it('el quiz de compresión no revela su respuesta en la ayuda inicial', () => {
    const exercise = exercises.find((e) => e.id === '21.4')!;
    expect(exercise.topicSlug).toBe('compresion');
    expect(exercise.rule.toLowerCase()).not.toContain('sin pérdida');
    expect(exercise.hints.join(' ').toLowerCase()).not.toContain('sin pérdida');
  });
  it('seis grupos, 25 artículos completos y glosario', () => {
    expect(groups).toHaveLength(6);
    expect(topics).toHaveLength(25);
    expect(new Set(topics.map((t) => t.slug)).size).toBe(25);
    for (const topic of topics) {
      const text = readFileSync(
        `src/content/topics/${String(topic.id).padStart(2, '0')}.md`,
        'utf8',
      );
      expect(text.length).toBeGreaterThan(250);
      expect(text).not.toMatch(/placeholder|lorem ipsum|profesor|clase del/i);
      expect(topic.rule).toBeTruthy();
      expect(topic.error).toBeTruthy();
    }
    expect(readFileSync('src/content/topics/14.md', 'utf8')).toContain(
      '1111111111110110',
    );
  });
  it('21 × 4, ids únicos y campos educativos revisados íntegros', () => {
    expect(categories).toHaveLength(21);
    expect(exercises).toHaveLength(84);
    expect(new Set(exercises.map((e) => e.id)).size).toBe(84);
    for (const category of categories)
      expect(
        exercises.filter((e) => e.categoryId === category.id),
      ).toHaveLength(4);
    expect(reviewed.schemaVersion).toBe(1);
    expect(exercises.map((exercise) => exercise.id)).toEqual(
      reviewed.exercises.map((exercise) => exercise.id),
    );
    for (const [index, exercise] of exercises.entries()) {
      const fields = [
        exercise.id,
        exercise.categoryId,
        exercise.prompt,
        exercise.academicAnswer,
        exercise.explanation,
      ];
      expect(
        createHash('sha256').update(JSON.stringify(fields)).digest('hex'),
        exercise.id,
      ).toBe(reviewed.exercises[index].sha256);
    }
  });
  it('comprueba los archivos educativos revisados sin fuentes externas', () => {
    const expectedPaths = [
      ...topics.map(
        (topic) => `src/content/topics/${String(topic.id).padStart(2, '0')}.md`,
      ),
      'src/content/topics/glossary.md',
      'src/content/catalog.ts',
      'src/content/exercises/hints.ts',
      'src/content/exercises/registry.ts',
      'src/content/exercises/original.json',
      'src/features/learn/TopicDemo.tsx',
    ];
    expect(reviewed.files.map((file) => file.path).sort()).toEqual(
      expectedPaths.sort(),
    );
    for (const file of reviewed.files) {
      const text = readFileSync(file.path, 'utf8').replace(/\r\n/g, '\n');
      expect(createHash('sha256').update(text).digest('hex'), file.path).toBe(
        file.sha256,
      );
    }
  });
  exercises.forEach((exercise, index) =>
    it(`audita ${exercise.id}: solución, evaluación y cuatro alternativas`, () => {
      expect(exercise.fields.map((f) => f.canonical)).toEqual(verified[index]);
      expect(evaluateAnswers(exercise.fields, verified[index]).status).toBe(
        'correct',
      );
      expect(exercise.choices).toHaveLength(4);
      expect(new Set(exercise.choices.map((c) => c.label)).size).toBe(4);
      expect(
        exercise.choices.filter(
          (c) =>
            evaluateAnswers(exercise.fields, c.values).status === 'correct',
        ),
      ).toHaveLength(1);
      for (const field of exercise.fields) {
        expect(evaluateField(field, field.canonical).status).toBe('correct');
        expect(evaluateField(field, '').status).toBe('empty');
        for (const wrong of field.distractors)
          expect(
            evaluateField(field, wrong).status,
            `${exercise.id} ${field.label}: ${wrong}`,
          ).toBe('incorrect');
      }
    }),
  );
  it('equivalencias, formatos y tolerancia declarada', () => {
    const fields = (id: string) => exercises.find((e) => e.id === id)!.fields;
    expect(evaluateAnswers(fields('02.1'), ['000182']).status).toBe('correct');
    expect(evaluateAnswers(fields('03.1'), ['00100101']).status).toBe(
      'correct',
    );
    expect(evaluateAnswers(fields('03.3'), ['010101101']).status).toBe(
      'format',
    );
    expect(
      evaluateAnswers(fields('14.1'), ['0010 | 0000 | 1000 | 0100']).status,
    ).toBe('correct');
    expect(evaluateAnswers(fields('15.1'), ['00,10100']).status).toBe(
      'correct',
    );
    expect(evaluateAnswers(fields('16.3'), ['1/256']).status).toBe('correct');
    expect(
      evaluateAnswers(fields('08.4'), ['1000000', '0,953674']).status,
    ).toBe('correct');
    expect(evaluateAnswers(fields('08.4'), ['1000000', '0,9536']).status).toBe(
      'incorrect',
    );
    expect(
      evaluateAnswers(fields('18.1'), [
        '0 | 01111111 | 00000000000000000000000',
      ]).status,
    ).toBe('correct');
    expect(evaluateAnswers(fields('20.1'), ['#123456']).status).toBe('correct');
    expect(
      evaluateAnswers(fields('21.4'), ['COMPRESIÓN SIN PÉRDIDA.']).status,
    ).toBe('correct');
    expect(evaluateAnswers(fields('02.1'), ['182abc']).status).toBe('format');
    expect(evaluateAnswers(fields('02.1'), ['1'.repeat(513)]).status).toBe(
      'format',
    );
  });
});
