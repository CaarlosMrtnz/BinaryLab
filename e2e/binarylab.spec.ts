import { test, expect } from '@playwright/test';
import { topics } from '../src/content/catalog';

for (const width of [390, 768]) {
  test(`drawer de práctica a ${width}px: cabecera estable, scroll interno y fondo bloqueado`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 600 });
    await page.goto('/practicar/01');
    if (width === 768) {
      await page.getByRole('button', { name: 'Activar modo oscuro' }).click();
      await page.getByRole('switch', { name: 'Lectura cómoda' }).click();
    }
    const trigger = page.getByRole('button', {
      name: 'Abrir menú',
      exact: true,
    });
    await trigger.click();
    const drawer = page.getByRole('dialog');
    const body = drawer.locator('.drawer-body');
    const header = drawer.locator('.drawer-header');
    await expect(drawer).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    const top = await page.evaluate(() => scrollY);
    expect(
      await drawer.evaluate((el) => el.getBoundingClientRect().height),
    ).toBe(600);
    const initialHeader = await header.boundingBox();
    await body.hover();
    await page.mouse.wheel(0, 650);
    await expect
      .poll(() => body.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);
    expect(await header.boundingBox()).toEqual(initialHeader);
    expect(await page.evaluate(() => scrollY)).toBe(top);
    expect(await drawer.evaluate((el) => el.scrollTop)).toBe(0);
    expect(await body.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
      true,
    );
    await body.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.mouse.wheel(0, 500);
    expect(await page.evaluate(() => scrollY)).toBe(top);
    await page.mouse.move(width - 5, 400);
    await page.mouse.wheel(0, 500);
    expect(await page.evaluate(() => scrollY)).toBe(top);
    await page.screenshot({ path: `artifacts/binarylab-drawer-${width}.png` });
    await drawer.getByRole('link', { name: /21.*Sonido y compresión/ }).click();
    await expect(page).toHaveURL(/\/practicar\/21$/);
    await expect(drawer).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    await trigger.click();
    await page.setViewportSize({ width, height: 420 });
    await expect
      .poll(() => drawer.evaluate((el) => el.getBoundingClientRect().height))
      .toBe(420);
    await expect(
      drawer.getByRole('button', { name: 'Cerrar menú' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await page.mouse.wheel(0, 400);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    await trigger.click();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(drawer).toHaveCount(0);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });
}

test('teclado: bits, copia, opciones y menú con foco visible', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const bit = page.getByRole('button', {
    name: 'Bit 0, peso 1, activado',
    exact: true,
  });
  await bit.focus();
  await page.keyboard.press('Space');
  await expect(page.getByTestId('result-10')).toHaveText('148₁₀');
  const copy = page.getByRole('button', {
    name: 'Copiar decimal',
    exact: true,
  });
  await copy.focus();
  await expect(copy).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Copiado', { exact: true })).toBeVisible();
  await page.goto('/practicar/02');
  await page.getByRole('button', { name: /Decimal: 182/ }).focus();
  await page.keyboard.press('Space');
  await expect(
    page.getByRole('heading', { name: 'Correcto', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole('button', { name: 'Abrir menú', exact: true });
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
});

test('los 25 artículos cargan directamente y refluyen a 320 píxeles', async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 320, height: 900 });
  for (const topic of topics) {
    await page.goto('/aprender/' + topic.slug);
    await expect(page.locator('main h1')).toHaveText(topic.title);
    await expect(page.getByRole('article')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      topic.slug,
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('Chromium se ejecuta desde artifacts y mantiene la instalación fuera de Git', async ({
  browser,
}) => {
  expect(browser.browserType().executablePath().replace(/\\/g, '/')).toContain(
    '/artifacts/pw-browsers/',
  );
});

test('operaciones por columnas, C2 y ayudas progresivas en móvil', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/aprender/suma-resta-not');
  await page.getByLabel('Operando A (0–255)', { exact: true }).fill('16');
  await page.getByLabel('Operando B (0–255)', { exact: true }).fill('1');
  await page
    .getByRole('combobox', { name: 'Operación', exact: true })
    .selectOption('subtract');
  await expect(page.getByRole('status')).toContainText(
    'Resultado matemático: 15',
  );
  await expect(
    page.getByRole('table', { name: 'Desarrollo columna a columna' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'artifacts/binarylab-columnas-movil.png',
    fullPage: true,
  });
  await page
    .locator('.demo')
    .screenshot({ path: 'artifacts/binarylab-aritmetica.png' });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('combobox', { name: 'Operación', exact: true })
    .selectOption('not');
  await expect(page.getByRole('status')).toContainText(
    'Patrón de ocho bits: 11101111',
  );
  await page.goto('/aprender/complemento-a-dos');
  await page.getByLabel('Entero con signo', { exact: true }).fill('-18');
  await expect(
    page.getByText('Inversión: 11101101', { exact: true }),
  ).toBeVisible();
  await page.goto('/practicar/02');
  await page.getByRole('button', { name: 'Pedir pista' }).click();
  await expect(
    page.getByText('Numera las posiciones desde cero por la derecha.', {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Otra pista' }).click();
  await expect(
    page.getByText('Solución y desarrollo', { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Mostrar desarrollo y solución' })
    .click();
  await expect(
    page.getByText(/Solución consultada antes de responder/),
  ).toBeVisible();
});

test('respuesta escrita con ancho fijo, equivalencia y fallo de copia real', async ({
  page,
}) => {
  await page.goto('/practicar/03');
  await page
    .getByRole('combobox', { name: 'Ejercicio', exact: true })
    .selectOption('2');
  await page
    .getByRole('combobox', { name: 'Modalidad', exact: true })
    .selectOption('written');
  await page
    .getByRole('textbox', { name: 'Binario', exact: true })
    .fill('010101101');
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Revisa el formato', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Binario', exact: true })
    .fill('1010 1101');
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Correcto', exact: true }),
  ).toBeVisible();
  await page.goto('/');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: () =>
          Promise.reject(new DOMException('denied', 'NotAllowedError')),
      },
    });
  });
  await page
    .getByRole('button', { name: 'Copiar decimal', exact: true })
    .click();
  await expect(
    page.getByText(
      'No se pudo copiar. Selecciona y copia el valor manualmente.',
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText('Copiado', { exact: true })).toHaveCount(0);
});

test('contraste de texto y límites de controles en ambos temas', async ({
  page,
}) => {
  function luminance(hex: string) {
    const short = hex.trim().replace('#', '');
    const c =
      short.length === 3
        ? [...short].map((digit) => digit + digit).join('')
        : short;
    const channels = [0, 2, 4]
      .map((i) => Number.parseInt(c.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }
  await page.goto('/');
  for (const mode of ['claro', 'oscuro']) {
    if (mode === 'oscuro')
      await page
        .getByRole('button', { name: 'Activar modo oscuro', exact: true })
        .click();
    const tokens = await page.locator('.app').evaluate((element) => {
      const css = getComputedStyle(element);
      return Object.fromEntries(
        [
          'text',
          'muted',
          'surface',
          'soft',
          'selected',
          'primary',
          'on-primary',
          'accent',
          'on-accent',
          'error-text',
          'error-bg',
          'success-text',
          'success-bg',
          'control',
        ].map((name) => [name, css.getPropertyValue('--' + name).trim()]),
      );
    });
    const pairs: [string, string, number][] = [
      ['text', 'surface', 4.5],
      ['muted', 'surface', 4.5],
      ['muted', 'soft', 4.5],
      ['text', 'selected', 4.5],
      ['on-primary', 'primary', 4.5],
      ['on-accent', 'accent', 4.5],
      ['error-text', 'error-bg', 4.5],
      ['success-text', 'success-bg', 4.5],
      ['control', 'soft', 3],
    ];
    for (const [fg, bg, threshold] of pairs) {
      const a = luminance(tokens[fg]),
        b = luminance(tokens[bg]);
      expect(
        (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        `${mode}: ${fg}/${bg}`,
      ).toBeGreaterThanOrEqual(threshold);
    }
  }
});

test('evidencias visuales del build real', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.screenshot({
    path: 'artifacts/binarylab-claro.png',
    fullPage: true,
  });
  await page
    .getByRole('button', { name: 'Activar modo oscuro', exact: true })
    .click();
  await page.screenshot({
    path: 'artifacts/binarylab-oscuro.png',
    fullPage: true,
  });
  await page
    .getByRole('switch', { name: 'Lectura cómoda', exact: true })
    .click();
  await page.screenshot({
    path: 'artifacts/binarylab-lectura.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator('.app-header')
    .screenshot({ path: 'artifacts/binarylab-header.png' });
  await page.screenshot({
    path: 'artifacts/binarylab-movil.png',
    fullPage: true,
  });
});

test('conversión completa, bits, pasos, teclado, ancho y copia', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await expect(page.getByTestId('result-10')).toHaveText('149₁₀');
  await expect(page.getByTestId('result-16')).toHaveText('95₁₆');
  await expect(page.getByTestId('result-8')).toHaveText('225₈');
  const input = page.getByLabel(/Número en binario/);
  await input.focus();
  await input.press('2');
  await expect(input).toHaveValue('10010101');
  await expect(
    page.getByText('En binario solo puedes escribir 0 y 1.'),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Bit 0, peso 1, activado', exact: true })
    .click();
  await expect(page.getByTestId('result-10')).toHaveText('148₁₀');
  await page.getByRole('tab', { name: 'Pasos', exact: true }).click();
  await expect(
    page.getByText(/Comprobación: ambas representaciones valen 148/),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Hexadecimal', exact: true }).click();
  await expect(page.getByLabel(/Número en hexadecimal/)).toHaveValue('94');
  await page.getByLabel(/Número en hexadecimal/).fill('A5');
  await expect(page.getByTestId('result-10')).toHaveText('165₁₀');
  await page.getByRole('combobox', { name: 'Ancho en bits' }).selectOption('4');
  await expect(page.getByText(/necesita 8 bits y no cabe en 4/)).toBeVisible();
  await expect(page.getByTestId('result-10')).toHaveText('165₁₀');
  await page
    .getByRole('button', { name: 'Copiar decimal', exact: true })
    .click();
  await expect(page.getByText('Copiado', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('165');
  await page.getByRole('button', { name: 'Restablecer' }).click();
  await page.getByRole('tab', { name: 'Binario', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('tab', { name: 'Decimal', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
});

test('pegado inválido íntegro, selección, vacío y cifras grandes', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const input = page.getByLabel(/Número en binario/);
  await page.evaluate(() => navigator.clipboard.writeText('10x1'));
  await input.focus();
  await input.press('ControlOrMeta+A');
  await input.press('ControlOrMeta+V');
  await expect(input).toHaveValue('10010101');
  await page.evaluate(() => navigator.clipboard.writeText('0011'));
  await input.press('ControlOrMeta+A');
  await input.press('ControlOrMeta+V');
  await expect(input).toHaveValue('0011');
  await input.fill('');
  await expect(page.getByTestId('result-10')).toHaveText('—₁₀');
  await page.getByRole('tab', { name: 'Decimal', exact: true }).click();
  const decimal = page.getByLabel(/Número en decimal/);
  const value = '9'.repeat(200);
  await decimal.fill(value);
  await page.getByRole('tab', { name: 'Binario', exact: true }).click();
  await expect(page.getByTestId('result-10')).toHaveText(value + '₁₀');
  await expect(page.getByLabel(/Número en binario/)).toHaveValue(
    BigInt(value).toString(2),
  );
  await page.getByRole('tab', { name: 'Decimal', exact: true }).click();
  await expect(page.getByLabel(/Número en decimal/)).toHaveValue(value);
});

test('quiz protegido, error, acierto, escritura y reinicio al recargar', async ({
  page,
}) => {
  await page.goto('/practicar/02');
  await page.getByRole('tab', { name: 'Pasos', exact: true }).click();
  await expect(page.getByText('Solución y desarrollo')).toHaveCount(0);
  await page.getByRole('button', { name: /Decimal: 183/ }).click();
  await expect(
    page.getByRole('heading', { name: 'No es correcto', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Solución y desarrollo')).toBeVisible();
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await page.getByRole('button', { name: /Decimal: 182/ }).click();
  await expect(
    page.getByRole('heading', { name: 'Correcto', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('combobox', { name: 'Modalidad' })
    .selectOption('written');
  await page
    .getByRole('textbox', { name: 'Decimal', exact: true })
    .fill('000182');
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await expect(
    page.getByRole('heading', { name: 'Correcto', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Correcto', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('tab', { name: 'Pasos', exact: true }).click();
  await page.getByRole('button', { name: 'Mostrar solución' }).click();
  await expect(
    page.getByText(/Solución consultada antes de responder/),
  ).toBeVisible();
});

test('rutas profundas, teoría, demos y 404 sin errores de consola', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/aprender/complemento-a-dos');
  await expect(
    page
      .getByRole('heading', { name: 'Complemento a dos (C2)', exact: true })
      .first(),
  ).toBeVisible();
  await page.getByLabel('Entero con signo', { exact: true }).fill('-18');
  await expect(page.locator('.demo-output').first()).toContainText('11101110');
  await page.reload();
  await expect(page.getByRole('article')).toContainText('Extensión de signo');
  await page.goto('/aprender/bcd');
  await page.getByLabel('Cifras decimales', { exact: true }).fill('95');
  await expect(page.locator('.demo-output').first()).toHaveText('1001 0101');
  await page.goto('/aprender/ieee-754');
  await expect(page.locator('.demo-output')).toContainText('C19D8000');
  await page.goto('/no-existe');
  await expect(
    page.getByRole('heading', { name: 'Página no encontrada' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('tema, lectura efímera, menú móvil, foco, Escape y reflujo', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Abrir menú', exact: true });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page
    .getByRole('button', { name: 'Activar modo oscuro', exact: true })
    .click();
  await page
    .getByRole('switch', { name: 'Lectura cómoda', exact: true })
    .click();
  await expect(page.locator('.app')).toHaveClass(/dark/);
  await expect(page.locator('.app')).toHaveClass(/comfortable/);
  const reading = page.getByRole('switch', { name: 'Lectura cómoda' });
  await expect(reading).toBeChecked();
  await expect(reading).toHaveText('Lectura cómoda');
  await reading.focus();
  await page.keyboard.press('Space');
  await expect(reading).not.toBeChecked();
  await expect(reading).toHaveText('Lectura normal');
  await expect(page.locator('.app')).not.toHaveClass(/comfortable/);
  await page.keyboard.press('Space');
  await expect(reading).toBeChecked();
  await expect(page.locator('.brand')).toHaveText('BinaryLab');
  await expect(page.locator('.brand')).toHaveCSS('font-family', /Inter/);
  await expect(page.locator('.brand-mark')).toHaveCount(0);
  await expect(page.getByTestId('result-10')).toHaveText('149₁₀');
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `reflujo a ${width}`,
    ).toBe(true);
  }
  await page.reload();
  await expect(page.locator('.app')).not.toHaveClass(/dark|comfortable/);
  await expect(reading).not.toBeChecked();
  await expect(reading).toHaveText('Lectura normal');
  expect(
    await page.evaluate(() => [
      localStorage.length,
      sessionStorage.length,
      document.cookie,
    ]),
  ).toEqual([0, 0, '']);
});

test('21 categorías accesibles y ambas modalidades; sin peticiones externas', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173/'))
      external.push(request.url());
  });
  for (let i = 1; i <= 21; i++) {
    const id = String(i).padStart(2, '0');
    await page.goto('/practicar/' + id);
    await expect(page.locator('.choice')).toHaveCount(4);
    await page
      .getByRole('combobox', { name: 'Modalidad' })
      .selectOption('written');
    await expect(page.getByRole('button', { name: 'Comprobar' })).toBeVisible();
  }
  expect(external).toEqual([]);
});

test('IEEE revisado: artículo, demo y recarga en ambos formatos', async ({
  page,
}) => {
  await page.goto('/aprender/ieee-754');
  const article = page.getByRole('article');
  await expect(article).toContainText('−19,6875');
  await expect(article).toContainText('59/256');
  await expect(article).toContainText('C19D8000');
  await expect(article).not.toContainText('148,421875');
  await expect(
    page.getByRole('combobox', { name: 'Ejemplo', exact: true }),
  ).toHaveValue('-19.6875');
  await expect(page.locator('.demo-output')).toContainText('Hex: C19D8000');
  await page
    .getByRole('combobox', { name: 'Formato', exact: true })
    .selectOption('64');
  await expect(page.locator('.demo-output')).toContainText(
    'Hex: C033B00000000000',
  );
  await expect(page.locator('.demo-output')).toContainText(
    'Valor almacenado: -19.6875',
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.locator('.demo-output')).toContainText('Hex: C19D8000');
});
