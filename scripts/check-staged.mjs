import { execFileSync } from 'node:child_process';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const files = git('diff', '--cached', '--name-only', '--diff-filter=ACM')
  .trim()
  .split('\n')
  .filter(Boolean);
const rules = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{24,}/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bsk-[A-Za-z0-9_-]{32,}/,
  /(?:password|api[_-]?key|access[_-]?token)\s*[:=]\s*["'][^"'\s]{12,}["']/i,
];
let failed = false;
for (const file of files) {
  if (
    /(^|\/)(?:\.env(?:\.|$)|private\/|secrets\/)|\.(?:pem|key|p12|pfx|pdf)$/i.test(
      file,
    )
  ) {
    console.error(`Ruta privada o sensible en índice: ${file}`);
    failed = true;
  }
  const content = git('show', `:${file}`);
  if (rules.some((rule) => rule.test(content))) {
    console.error(`Posible secreto en ${file}; revisar sin imprimir su valor.`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log(
  `Revisadas ${files.length} rutas del índice. Sin coincidencias en los patrones básicos; no equivale a una detección exhaustiva.`,
);
