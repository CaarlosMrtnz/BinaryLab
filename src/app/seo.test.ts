import { afterEach, describe, expect, it } from 'vitest';
import { categories, topics } from '../content/catalog';
import {
  applySeoHead,
  notFoundPage,
  publicPages,
  renderSeoHead,
  resolveSeoPage,
  seoAttribute,
  siteOrigin,
  socialImage,
} from './seo';

afterEach(() => {
  document.head
    .querySelectorAll(`[${seoAttribute}]`)
    .forEach((tag) => tag.remove());
});

describe('rutas y metadatos SEO compartidos', () => {
  it('representa exactamente las 49 URLs del catálogo, sin ejercicios ni glosario ficticios', () => {
    const expected = [
      '/',
      '/aprender',
      ...topics.map((topic) => `/aprender/${topic.slug}`),
      '/practicar',
      ...categories.map((category) => `/practicar/${category.id}`),
    ];
    expect(publicPages.map((page) => page.path)).toEqual(expected);
    expect(new Set(expected).size).toBe(49);
    for (const page of publicPages) {
      expect(page.path).not.toBeNull();
      expect(resolveSeoPage(page.path ?? '')).toBe(page);
      expect(page.title).toContain('BinaryLab');
      expect(page.description.length).toBeGreaterThan(50);
    }
  });

  it('consolida barras finales, index.html, query y fragmentos sin cambiar slugs ni ids', () => {
    for (const page of publicPages) {
      const path = page.path === '/' ? '' : page.path;
      for (const variant of [
        `${path}/`,
        `${path}///`,
        `${path}/index.html`,
        `${path}/?utm_source=portfolio#ejemplo`,
        `${path || '/'}?tema=oscuro`,
      ])
        expect(resolveSeoPage(variant), variant).toBe(page);
    }
  });

  it.each([
    '/no-existe',
    '/aprender/no-existe',
    '/practicar/99',
    '/practicar/1',
    '/glosario',
    '/aprender/complemento-a-dos/extra',
    '/APRENDER/complemento-a-dos',
    '/aprender//complemento-a-dos',
    '/404.html',
    'https://otro.example/aprender',
  ])('no reconoce como pública la URL %s', (path) => {
    expect(resolveSeoPage(path)).toBe(notFoundPage);
  });

  it('describe portada, índices, artículos y categorías sin reutilizar la descripción de portada', () => {
    expect(resolveSeoPage('/').title).toBe(
      'Conversor binario y de bases · BinaryLab',
    );
    expect(resolveSeoPage('/aprender').description).toContain('25 temas');
    expect(resolveSeoPage('/practicar').description).toContain(
      '84 actividades',
    );
    expect(resolveSeoPage('/aprender/ieee-754').title).toBe(
      'IEEE 754 y precisión · BinaryLab',
    );
    expect(resolveSeoPage('/practicar/02').title).toBe(
      'Ejercicios: Binario a decimal · BinaryLab',
    );
    for (const page of publicPages.slice(1))
      expect(page.description).not.toBe(publicPages[0].description);
  });

  it('emite HTML español con canonical propio, metadatos sociales únicos e imagen absoluta', () => {
    for (const page of publicPages) {
      const doc = new DOMParser().parseFromString(
        renderSeoHead(page),
        'text/html',
      );
      expect(doc.querySelectorAll('title')).toHaveLength(1);
      expect(doc.title).toBe(page.title);
      expect(doc.querySelectorAll('meta[name="description"]')).toHaveLength(1);
      expect(
        doc.querySelector('meta[name="description"]')?.getAttribute('content'),
      ).toBe(page.description);
      expect(doc.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
      expect(
        doc.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      ).toBe(`${siteOrigin}${page.path}`);
      expect(
        doc.querySelector('meta[property="og:url"]')?.getAttribute('content'),
      ).toBe(`${siteOrigin}${page.path}`);
      expect(
        doc.querySelector('meta[property="og:image"]')?.getAttribute('content'),
      ).toBe(socialImage);
      expect(
        doc
          .querySelector('meta[property="og:locale"]')
          ?.getAttribute('content'),
      ).toBe('es_ES');
      expect(
        doc.querySelector('meta[name="twitter:card"]')?.getAttribute('content'),
      ).toBe('summary_large_image');
      expect(
        doc
          .querySelector('meta[property="og:image:alt"]')
          ?.getAttribute('content'),
      ).toContain('Conversor');
      const keys = [...doc.querySelectorAll('meta')].map(
        (tag) => tag.getAttribute('name') ?? tag.getAttribute('property'),
      );
      expect(new Set(keys).size).toBe(keys.length);
      expect(doc.querySelector('meta[name="robots"]')).toBeNull();
      expect(doc.querySelector('link[hreflang="en"]')).toBeNull();
    }
  });

  it('escapa la redacción al generar HTML, sin convertir texto en etiquetas', () => {
    const title = '<img src=x onerror="alert(1)"> & BinaryLab';
    const description = 'Un valor "entre comillas", <otro> & más.';
    const doc = new DOMParser().parseFromString(
      renderSeoHead({ ...publicPages[0], title, description }),
      'text/html',
    );
    expect(doc.title).toBe(title);
    expect(
      doc.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toBe(description);
    expect(doc.querySelector('img')).toBeNull();
  });

  it('reemplaza metadatos al navegar, retira noindex y no duplica etiquetas bajo efectos repetidos', () => {
    const first = resolveSeoPage('/aprender/complemento-a-dos');
    const next = resolveSeoPage('/practicar/02');
    applySeoHead(first);
    applySeoHead(notFoundPage);
    expect(document.title).toBe('Página no encontrada · BinaryLab');
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow',
    );
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
    expect(document.head.querySelector('meta[property="og:url"]')).toBeNull();
    expect(document.head.querySelector('meta[name="twitter:card"]')).toBeNull();
    applySeoHead(next);
    applySeoHead(next);
    expect(document.title).toBe(next.title);
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
    expect(document.head.querySelectorAll('title')).toHaveLength(1);
    expect(
      document.head.querySelectorAll('link[rel="canonical"]'),
    ).toHaveLength(1);
    expect(
      document.head.querySelector('link[rel="canonical"]'),
    ).toHaveAttribute('href', `${siteOrigin}/practicar/02`);
    expect(
      document.head.querySelector('meta[name="description"]'),
    ).toHaveAttribute('content', next.description);
    expect(document.head.innerHTML).not.toContain(first.title);
  });
});
