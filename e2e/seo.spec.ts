import { expect, test } from '@playwright/test';
import { publicPages, siteOrigin, socialImage } from '../src/app/seo';

test('los 49 HTML iniciales y sus canonical son específicos antes de ejecutar JavaScript', async ({
  request,
}) => {
  for (const page of publicPages) {
    const response = await request.get(
      `${page.path === '/' ? '' : page.path}/index.html`,
    );
    expect(response.status()).toBe(200);
    const source = await response.text();
    expect(source).toContain('<html lang="es">');
    expect(source.match(/rel="canonical"/g)).toHaveLength(1);
    expect(source).toContain(`href="${siteOrigin}${page.path}"`);
    expect(source).toContain(`content="${socialImage}"`);
    expect(source).not.toContain('noindex');
    const scripts = [...source.matchAll(/<script[^>]+src="([^"]+)"/g)];
    expect(scripts).toHaveLength(1);
    expect(scripts[0][1]).toMatch(/^\/assets\/.+\.js$/);
  }
});

test('robots, sitemap e imagen social se sirven con contenido y MIME correctos', async ({
  request,
}) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(robots.headers()['content-type']).toContain('text/plain');
  expect(await robots.text()).toBe(
    `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`,
  );
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toMatch(
    /(?:application|text)\/xml/,
  );
  const xml = await sitemap.text();
  expect(
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
  ).toEqual(publicPages.map((page) => `${siteOrigin}${page.path}`));
  const image = await request.get('/social-preview.png');
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toContain('image/png');
  const bytes = await image.body();
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(bytes.readUInt32BE(16)).toBe(1200);
  expect(bytes.readUInt32BE(20)).toBe(630);
});

test('artículos y categorías mantienen metadatos únicos al navegar, recargar y usar barras o query', async ({
  page,
}) => {
  const initial = '/aprender/complemento-a-dos';
  await page.goto(`${initial}/?utm_source=portfolio#ejemplo`);
  await expect(page.locator('main h1')).toHaveText('Complemento a dos (C2)');
  await expect(page).toHaveTitle('Complemento a dos (C2) · BinaryLab');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${siteOrigin}${initial}`,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `${siteOrigin}${initial}`,
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Complemento a dos/,
  );
  await page
    .getByRole('link', { name: 'Practicar este tema', exact: true })
    .click();
  await expect(page).toHaveURL(/\/practicar\/12$/);
  await expect(page).toHaveTitle('Ejercicios: Complemento a dos · BinaryLab');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${siteOrigin}/practicar/12`,
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Practica «Complemento a dos»/,
  );
  await page.reload();
  await expect(page.locator('main h1')).toContainText('Complemento a dos');
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);
});

test('el error cliente elimina metadatos anteriores y regresar retira noindex sin recargar', async ({
  page,
}) => {
  await page.goto('/aprender/ieee-754');
  await expect(page).toHaveTitle('IEEE 754 y precisión · BinaryLab');
  await page.evaluate(() => {
    window.history.pushState({}, '', '/no-existe-seo');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page.locator('main h1')).toHaveText('Página no encontrada');
  await expect(page).toHaveTitle('Página no encontrada · BinaryLab');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(0);
  await page
    .getByRole('link', { name: 'Volver al conversor', exact: true })
    .click();
  await expect(page).toHaveURL('/');
  await expect(page).toHaveTitle('Conversor binario y de bases · BinaryLab');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${siteOrigin}/`,
  );
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
});

test('el HTML de error del build es noindex; Vite preview no acredita el estado HTTP de Netlify', async ({
  request,
  page,
}) => {
  const response = await request.get('/404.html');
  expect(await response.text()).toContain('content="noindex, follow"');
  await page.goto('/practicar/99');
  await expect(page.locator('main h1')).toHaveText('Página no encontrada');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, follow',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
