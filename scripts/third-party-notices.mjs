import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(
  readFileSync(resolve(root, 'package-lock.json'), 'utf8'),
);
const sections = [];
const missing = [];
// Their compiler packages are dev-only, but CSS and preload helpers ship to users.
const shippedBuildResources = new Set([
  'node_modules/tailwindcss',
  'node_modules/vite',
]);
// This published package omits LICENSE. Preserve the upstream notice separately.
const supplements = {
  'react-remove-scroll-bar@2.3.8': {
    file: 'licenses/react-remove-scroll-bar-2.3.8.LICENSE',
    sha256: 'a79aae0c0f21990d9d963bb3c5a79cdcea9a46f8523ba55c58d7fe776b6ebc84',
  },
};
for (const [directory, entry] of Object.entries(lock.packages)) {
  if (!directory || (entry.dev && !shippedBuildResources.has(directory)))
    continue;
  const location = resolve(root, directory);
  const metadata = JSON.parse(
    readFileSync(resolve(location, 'package.json'), 'utf8'),
  );
  if (metadata.version !== entry.version)
    throw new Error(`Versión instalada distinta del lockfile: ${directory}`);
  const licenses = readdirSync(location)
    .filter((name) =>
      /^(?:licen[cs]e|copying|notice)(?:\.[a-z]+)?$/i.test(name),
    )
    .sort();
  let notice = licenses
    .map(
      (name) =>
        `${name}\n\n${readFileSync(resolve(location, name), 'utf8').replace(/\r\n/g, '\n').trim()}`,
    )
    .join('\n\n');
  const supplement = supplements[`${metadata.name}@${metadata.version}`];
  if (!notice && supplement) {
    const bytes = readFileSync(resolve(root, supplement.file));
    if (createHash('sha256').update(bytes).digest('hex') !== supplement.sha256)
      throw new Error(`Aviso suplementario alterado: ${supplement.file}`);
    notice = `${supplement.file}\n\n${bytes.toString('utf8').replace(/\r\n/g, '\n').trim()}`;
  }
  if (!notice) {
    missing.push(`${metadata.name}@${metadata.version}`);
    continue;
  }
  sections.push({
    key: `${metadata.name}@${metadata.version} (${directory})`,
    text: notice,
    license: metadata.license ?? entry.license ?? 'See upstream notice',
  });
}
if (missing.length)
  throw new Error(`Faltan avisos de producción: ${missing.join(', ')}`);
sections.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
const output =
  [
    'BinaryLab — third-party runtime and generated resource notices',
    'Generated from package-lock.json and the unmodified license files in installed packages.',
    'This file does not license BinaryLab educational content. See LICENSE-SCOPE.md.',
    ...sections.map(
      ({ key, text, license }) =>
        `${'='.repeat(72)}\n${key}\nDeclared license: ${license}\n\n${text}`,
    ),
  ].join('\n\n') + '\n';
const target = resolve(root, 'public/THIRD-PARTY-NOTICES.txt');
if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== output)
    throw new Error(
      'Avisos desactualizados. Ejecuta npm run license:notices y revisa el diff.',
    );
} else writeFileSync(target, output);
console.log(
  `Avisos de ${sections.length} paquetes de terceros ${process.argv.includes('--check') ? 'verificados' : 'generados'}.`,
);
