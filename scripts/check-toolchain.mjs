import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { ESLint } from 'eslint';

const expectedNode = readFileSync(
  new URL('../.nvmrc', import.meta.url),
  'utf8',
).trim();
assert.equal(
  process.versions.node,
  expectedNode,
  `Activa Node ${expectedNode} según .nvmrc`,
);
console.log(`Node ${process.versions.node}: coincide con .nvmrc.`);

const require = createRequire(import.meta.url);
const consumers = [
  'eslint',
  '@eslint/config-array',
  '@typescript-eslint/typescript-estree',
];
const cases = [
  ['src/app/App.tsx', '**/*.{ts,tsx}', {}, true],
  ['src/app/App.css', '**/*.{ts,tsx}', {}, false],
  ['.hidden.ts', '*.ts', { dot: true }, true],
  ['dist/assets/app.js', '**/dist/**', { dot: true }, true],
  ['src/domain/numerals.ts', '**/*.test.ts', {}, false],
  ['src/domain/numerals.test.ts', '**/*.test.ts', {}, true],
];
for (const consumer of consumers) {
  const localRequire = createRequire(require.resolve(consumer));
  const matcher = localRequire('minimatch');
  assert.equal(localRequire('minimatch/package.json').version, '11.0.1');
  for (const [file, glob, options, expected] of cases) {
    assert.equal(
      matcher.minimatch(file, glob, options),
      expected,
      `${consumer}: ${glob}`,
    );
    assert.equal(new matcher.Minimatch(glob, options).match(file), expected);
  }
  assert.equal(
    new matcher.Minimatch('src/**/*.tsx').match('src/app', true),
    true,
  );
}
// Verificar también la exportación ESM usada por config-array.
const esm = await import('minimatch');
assert.equal(esm.minimatch('src/main.tsx', '**/*.tsx'), true);
const eslint = new ESLint();
assert.equal(await eslint.isPathIgnored('dist/assets/app.js'), true);
assert.ok(await eslint.calculateConfigForFile('src/main.tsx'));
const [invalid] = await eslint.lintText('const value: number = 1;\n', {
  filePath: 'src/toolchain-probe.ts',
});
assert.ok(
  invalid.messages.some(
    (message) => message.ruleId === '@typescript-eslint/no-unused-vars',
  ),
);
console.log(
  'Compatibilidad comprobada: 3 consumidores, CJS/ESM, globs y reglas ESLint/TypeScript.',
);
