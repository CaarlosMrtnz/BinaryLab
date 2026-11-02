import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { publicPages, siteOrigin, seoStart } from './seo';

const directories: string[] = [];

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'binarylab-seo-'));
  directories.push(directory);
  mkdirSync(join(directory, 'assets'));
  writeFileSync(join(directory, 'assets/app.js'), 'export {};');
  writeFileSync(join(directory, 'assets/app.css'), '.app {}');
  copyFileSync('public/favicon.svg', join(directory, 'favicon.svg'));
  copyFileSync(
    'public/social-preview.png',
    join(directory, 'social-preview.png'),
  );
  const template = readFileSync('index.html', 'utf8')
    .replace('/src/main.tsx', '/assets/app.js')
    .replace(
      '</head>',
      '<link rel="stylesheet" href="/assets/app.css"></head>',
    );
  writeFileSync(join(directory, 'index.html'), template);
  return directory;
}

function generate(directory: string) {
  return execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "import { generateSeo } from './scripts/generate-seo.mjs'; generateSeo(process.argv[1]);",
      directory,
    ],
    { encoding: 'utf8', stdio: 'pipe' },
  );
}

function html(directory: string, file: string) {
  return new DOMParser().parseFromString(
    readFileSync(join(directory, file), 'utf8'),
    'text/html',
  );
}

afterEach(() => {
  for (const directory of directories.splice(0)) {
    if (
      resolve(dirname(directory)) !== resolve(tmpdir()) ||
      !basename(directory).startsWith('binarylab-seo-')
    )
      throw new Error('No se elimina un directorio ajeno a las pruebas SEO.');
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('generación SEO del build sin servicios externos', () => {
  it('genera los 49 HTML iniciales y conserva las rutas absolutas a JS, CSS y favicon', () => {
    const directory = fixture();
    expect(generate(directory)).toContain('49 páginas');
    for (const page of publicPages) {
      const doc = html(directory, join(page.path ?? '', 'index.html'));
      expect(doc.documentElement.lang).toBe('es');
      const verification = doc.head.querySelectorAll(
        'meta[name="google-site-verification"]',
      );
      expect(verification).toHaveLength(1);
      expect(verification[0]?.getAttribute('content')).toBe(
        'Bjmwd60fTq2UzK8sIxxljujjs62CRenchlaSfIAxTQg',
      );
      expect(verification[0]?.hasAttribute('data-binarylab-seo')).toBe(false);
      expect(doc.title).toBe(page.title);
      expect(doc.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
      expect(
        doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      ).toBe(`${siteOrigin}${page.path}`);
      expect(
        doc.querySelector('meta[name="description"]')?.getAttribute('content'),
      ).toBe(page.description);
      expect(
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      ).toBe(page.title);
      expect(doc.querySelector('meta[name="robots"]')).toBeNull();
      expect(
        doc.querySelector('script[type="module"]')?.getAttribute('src'),
      ).toBe('/assets/app.js');
      expect(
        doc.querySelector('link[rel="stylesheet"]')?.getAttribute('href'),
      ).toBe('/assets/app.css');
      expect(doc.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe(
        '/favicon.svg',
      );
      expect(doc.getElementById('root')?.childNodes).toHaveLength(0);
    }
    const generated = readdirSync(directory, { recursive: true }).filter(
      (name) => String(name).endsWith('.html'),
    );
    expect(generated).toHaveLength(50);
    const error = html(directory, '404.html');
    expect(error.title).toBe('Página no encontrada · BinaryLab');
    expect(
      error.querySelector('meta[name="robots"]')?.getAttribute('content'),
    ).toBe('noindex, follow');
    expect(error.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it('genera XML válido con las 49 URLs exactas y robots.txt con sitemap absoluto', () => {
    const directory = fixture();
    generate(directory);
    const source = readFileSync(join(directory, 'sitemap.xml'), 'utf8');
    const xml = new DOMParser().parseFromString(source, 'application/xml');
    expect(xml.querySelector('parsererror')).toBeNull();
    expect(xml.documentElement.namespaceURI).toBe(
      'http://www.sitemaps.org/schemas/sitemap/0.9',
    );
    expect(
      [...xml.querySelectorAll('loc')].map((node) => node.textContent),
    ).toEqual(publicPages.map((page) => `${siteOrigin}${page.path}`));
    expect(xml.querySelectorAll('url')).toHaveLength(49);
    expect(xml.querySelector('lastmod')).toBeNull();
    for (const url of xml.querySelectorAll('loc'))
      expect(url.textContent).not.toMatch(/glosario|404\.html|\?|#/);
    expect(readFileSync(join(directory, 'robots.txt'), 'utf8')).toBe(
      `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`,
    );
    expect(readFileSync(join(directory, 'social-preview.png'))).toEqual(
      readFileSync('public/social-preview.png'),
    );
  });

  it('produce los mismos bytes al ejecutarse de nuevo, sin acumular etiquetas', () => {
    const directory = fixture();
    generate(directory);
    const names = readdirSync(directory, { recursive: true })
      .map(String)
      .filter((name) => /\.(html|xml|txt)$/.test(name));
    const before = names.map((name) => readFileSync(join(directory, name)));
    generate(directory);
    names.forEach((name, index) =>
      expect(readFileSync(join(directory, name)), name).toEqual(before[index]),
    );
  });

  it('falla antes de generar páginas si falta un asset o la plantilla es inconsistente', () => {
    const directory = fixture();
    rmSync(join(directory, 'assets/app.js'));
    expect(() => generate(directory)).toThrow(
      'Falta el recurso /assets/app.js',
    );
    writeFileSync(join(directory, 'assets/app.js'), 'export {};');
    const template = readFileSync(join(directory, 'index.html'), 'utf8');
    writeFileSync(
      join(directory, 'index.html'),
      template.replace(seoStart, ''),
    );
    expect(() => generate(directory)).toThrow('Falta un único inicio SEO');
  });

  it('reserva el fallback de Netlify a 404 no forzado y conserva estáticos y URLs sin barra final', () => {
    const config = readFileSync('netlify.toml', 'utf8');
    expect(config).toMatch(/\[build\.processing\.html\]\s+pretty_urls = false/);
    const redirects = config.split('[[redirects]]').slice(1);
    expect(redirects).toHaveLength(1);
    expect(redirects[0]).toMatch(
      /from = "\/\*"\s+to = "\/404\.html"\s+status = 404\s+force = false/,
    );
    expect(config).not.toMatch(/status = 200/);
  });
});
