import { categories, topics } from '../content/catalog.ts';

export const siteOrigin = 'https://binarylab-interactive.netlify.app';
export const socialImage = `${siteOrigin}/social-preview.png`;
const socialImageAlt =
  'BinaryLab: aprende binario de forma interactiva. Conversor de bases, teoría y ejercicios prácticos.';
export const seoAttribute = 'data-binarylab-seo';
export const seoStart = '<!-- binarylab-seo:start -->';
export const seoEnd = '<!-- binarylab-seo:end -->';

export type SeoPage = {
  readonly path: string | null;
  readonly title: string;
  readonly description: string;
};

export const publicPages: readonly SeoPage[] = [
  {
    path: '/',
    title: 'Conversor binario y de bases · BinaryLab',
    description:
      'Convierte entre binario, decimal, octal y hexadecimal, edita bits y aprende representación digital con teoría, ejemplos y ejercicios interactivos.',
  },
  {
    path: '/aprender',
    title: 'Aprender binario y sistemas de numeración · BinaryLab',
    description:
      'Explora 25 temas sobre sistemas de numeración y representación digital, con ejemplos, glosario y demostraciones interactivas en BinaryLab.',
  },
  ...topics.map((topic) => ({
    path: `/aprender/${topic.slug}`,
    title: `${topic.title} · BinaryLab`,
    description: `${topic.title}: teoría de representación digital, ejemplos y acceso a la práctica correspondiente en BinaryLab.`,
  })),
  {
    path: '/practicar',
    title: 'Ejercicios de sistemas de numeración · BinaryLab',
    description:
      'Practica sistemas de numeración y representación digital con 84 actividades en 21 categorías, respuestas escritas, test, pistas y corrección razonada.',
  },
  ...categories.map((category) => ({
    path: `/practicar/${category.id}`,
    title: `Ejercicios: ${category.title} · BinaryLab`,
    description: `Practica «${category.title}» con preguntas tipo test y respuesta escrita, pistas y corrección razonada en BinaryLab.`,
  })),
];

export const notFoundPage: SeoPage = {
  path: null,
  title: 'Página no encontrada · BinaryLab',
  description:
    'Esta dirección no corresponde a una página de BinaryLab. Vuelve al conversor para explorar los temas y ejercicios disponibles.',
};

const pagesByPath = new Map(publicPages.map((page) => [page.path, page]));

export function resolveSeoPage(pathname: string): SeoPage {
  const path = pathname.split(/[?#]/, 1)[0].replace(/\/index\.html$/, '');
  const normalized = path.replace(/\/+$/, '') || '/';
  return pagesByPath.get(normalized) ?? notFoundPage;
}

type HeadElement = {
  tag: 'title' | 'meta' | 'link';
  attributes: Record<string, string>;
  text?: string;
};

function meta(
  attribute: 'name' | 'property',
  key: string,
  content: string,
): HeadElement {
  return { tag: 'meta', attributes: { [attribute]: key, content } };
}

export function seoElements(page: SeoPage): HeadElement[] {
  const elements: HeadElement[] = [
    { tag: 'title', attributes: {}, text: page.title },
    meta('name', 'description', page.description),
  ];
  if (page.path === null)
    return [...elements, meta('name', 'robots', 'noindex, follow')];

  const canonical = `${siteOrigin}${page.path}`;
  return [
    ...elements,
    { tag: 'link', attributes: { rel: 'canonical', href: canonical } },
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', 'BinaryLab'),
    meta('property', 'og:locale', 'es_ES'),
    meta('property', 'og:title', page.title),
    meta('property', 'og:description', page.description),
    meta('property', 'og:url', canonical),
    meta('property', 'og:image', socialImage),
    meta('property', 'og:image:width', '1200'),
    meta('property', 'og:image:height', '630'),
    meta('property', 'og:image:alt', socialImageAlt),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', page.title),
    meta('name', 'twitter:description', page.description),
    meta('name', 'twitter:image', socialImage),
    meta('name', 'twitter:image:alt', socialImageAlt),
  ];
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderSeoHead(page: SeoPage): string {
  return seoElements(page)
    .map(({ tag, attributes, text }) => {
      const attrs = Object.entries({ [seoAttribute]: '', ...attributes })
        .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
        .join('');
      return tag === 'title'
        ? `<title${attrs}>${escapeHtml(text ?? '')}</title>`
        : `<${tag}${attrs}>`;
    })
    .join('\n');
}

export function applySeoHead(page: SeoPage): void {
  document.head
    .querySelectorAll(`[${seoAttribute}]`)
    .forEach((element) => element.remove());
  for (const { tag, attributes, text } of seoElements(page)) {
    const element = document.createElement(tag);
    element.setAttribute(seoAttribute, '');
    for (const [name, value] of Object.entries(attributes))
      element.setAttribute(name, value);
    if (text !== undefined) element.textContent = text;
    document.head.append(element);
  }
}
