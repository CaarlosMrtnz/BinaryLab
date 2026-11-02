import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  escapeHtml,
  notFoundPage,
  publicPages,
  renderSeoHead,
  seoEnd,
  seoStart,
  siteOrigin,
} from '../src/app/seo.ts';

const buildDirectory = fileURLToPath(new URL('../dist/', import.meta.url));

export function generateSeo(outputDirectory = buildDirectory) {
  const template = readFileSync(join(outputDirectory, 'index.html'), 'utf8');
  assert.equal(
    template.split(seoStart).length,
    2,
    'Falta un único inicio SEO.',
  );
  assert.equal(template.split(seoEnd).length, 2, 'Falta un único final SEO.');
  const start = template.indexOf(seoStart) + seoStart.length;
  const end = template.indexOf(seoEnd);
  assert.ok(start < end, 'Los marcadores SEO están desordenados.');
  assert.match(
    template,
    /<html lang="es">/,
    'El documento debe estar en español.',
  );
  assert.match(
    template,
    /<div id="root"><\/div>/,
    'Se conserva el shell React vacío.',
  );
  assert.equal(
    publicPages.length,
    49,
    'Revisa la selección de rutas públicas.',
  );
  assert.equal(
    new Set(publicPages.map((page) => page.path)).size,
    49,
    'Rutas duplicadas.',
  );

  const references = [...template.matchAll(/(?:src|href)="(\/[^"]+)"/g)];
  assert.ok(
    references.some((match) => match[1].endsWith('.js')),
    'Falta el JS de Vite.',
  );
  assert.ok(
    references.some((match) => match[1].endsWith('.css')),
    'Falta el CSS de Vite.',
  );
  for (const [, reference] of references)
    assert.ok(
      existsSync(join(outputDirectory, reference)),
      `Falta el recurso ${reference}.`,
    );

  const image = readFileSync(join(outputDirectory, 'social-preview.png'));
  assert.equal(
    image.subarray(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    'La imagen social debe ser PNG.',
  );
  assert.equal(image.readUInt32BE(16), 1200, 'Anchura social incorrecta.');
  assert.equal(image.readUInt32BE(20), 630, 'Altura social incorrecta.');

  const documentFor = (page) =>
    `${template.slice(0, start)}\n${renderSeoHead(page)}\n${template.slice(end)}`;
  for (const page of publicPages) {
    assert.ok(
      page.path !== null && /^\/(?:[a-z0-9-]+\/?)*$/.test(page.path),
      'Ruta pública no segura.',
    );
    assert.ok(page.title && page.description, 'Metadatos incompletos.');
    const file = join(outputDirectory, page.path, 'index.html');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, documentFor(page));
  }
  writeFileSync(join(outputDirectory, '404.html'), documentFor(notFoundPage));
  writeFileSync(
    join(outputDirectory, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`,
  );
  writeFileSync(
    join(outputDirectory, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      publicPages
        .map(
          (page) =>
            `  <url><loc>${escapeHtml(`${siteOrigin}${page.path}`)}</loc></url>`,
        )
        .join('\n') +
      '\n</urlset>\n',
  );
  console.log(
    `SEO: ${publicPages.length} páginas, 404, robots.txt y sitemap.xml generados.`,
  );
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
)
  generateSeo();
