import { test, expect } from '@playwright/test';

test('Signed anuncia cada error en una sola región y recupera campos y rangos', async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const dark of [false, true]) {
      await page.goto('/aprender/complemento-a-dos');
      if (dark)
        await page
          .getByRole('button', { name: 'Activar modo oscuro', exact: true })
          .click();
      const demo = page.getByRole('region', {
        name: 'Demostración interactiva',
      });
      const value = demo.getByRole('textbox', {
        name: 'Entero con signo',
        exact: true,
      });
      const bits = demo.getByRole('textbox', {
        name: 'Interpreta un patrón (2–64 bits)',
        exact: true,
      });
      const size = demo.getByRole('combobox', { name: 'Ancho', exact: true });
      await value.fill('999');
      await expect(value).toHaveAttribute('aria-invalid', 'true');
      await expect(value).toHaveAccessibleDescription(
        /C2: Fuera de rango: -128…127\./,
      );
      await expect(
        demo.getByRole('status').filter({ hasText: /C2: Fuera de rango/ }),
      ).toHaveCount(1);
      await bits.fill('102');
      await expect(bits).toHaveAttribute('aria-invalid', 'true');
      await expect(bits).toHaveAccessibleDescription(
        'Introduce un patrón de 2 a 64 bits.',
      );
      await expect(
        demo
          .getByRole('status')
          .filter({ hasText: 'Introduce un patrón de 2 a 64 bits.' }),
      ).toHaveCount(1);
      for (const region of await demo.getByRole('status').all())
        await expect(region).toHaveAttribute('aria-atomic', 'true');
      await demo.screenshot({
        path: `artifacts/ux-signed-${width}-${dark ? 'oscuro' : 'claro'}-error.png`,
      });
      await size.selectOption('16');
      await expect(value).toHaveAttribute('aria-invalid', 'false');
      await expect(value).toHaveAccessibleDescription('');
      await value.fill('-128');
      await size.selectOption('8');
      await expect(value).toHaveAccessibleDescription(
        'Magnitud y signo: Fuera de rango: -127…127. C1: Fuera de rango: -127…127.',
      );
      await value.fill('');
      await bits.fill('');
      await expect(value).toHaveAttribute('aria-invalid', 'false');
      await expect(bits).toHaveAttribute('aria-invalid', 'false');
      for (const region of await demo.getByRole('status').all())
        await expect(region).toBeEmpty();
      await value.fill('-18');
      await bits.fill('11101110');
      await expect(value).toHaveAccessibleDescription('');
      await expect(bits).toHaveAccessibleDescription('');
      await expect(demo).toContainText('Sumar 1: 11101110');
      await demo.screenshot({
        path: `artifacts/ux-signed-${width}-${dark ? 'oscuro' : 'claro'}-valido.png`,
      });
    }
  }
});

test('encabezados e instrucciones respetan sección y modalidad sin cambiar el diseño', async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const dark of [false, true]) {
      const suffix = `${width}-${dark ? 'oscuro' : 'claro'}`;
      await page.goto('/');
      if (dark)
        await page
          .getByRole('button', { name: 'Activar modo oscuro', exact: true })
          .click();
      await expect(
        page.getByRole('heading', { name: 'Explora los bits', level: 2 }),
      ).toBeVisible();
      await page
        .locator('.bit-editor')
        .screenshot({ path: `artifacts/ux-bits-${suffix}.png` });
      await page.goto('/aprender/compresion');
      if (dark)
        await page
          .getByRole('button', { name: 'Activar modo oscuro', exact: true })
          .click();
      await expect(
        page.getByRole('heading', { name: 'Evita este error', level: 2 }),
      ).toBeVisible();
      await page
        .locator('.article-note')
        .screenshot({ path: `artifacts/ux-encabezado-${suffix}.png` });
      await page.goto('/practicar/13');
      if (dark)
        await page
          .getByRole('button', { name: 'Activar modo oscuro', exact: true })
          .click();
      await expect(
        page.getByText(
          /^Elige una alternativa que resuelva todas las partes\./,
        ),
      ).toBeVisible();
      await expect(
        page.getByText(/^Responde cada parte por separado\./),
      ).toHaveCount(0);
      await page
        .locator('.exercise-panel')
        .screenshot({ path: `artifacts/ux-test-${suffix}.png` });
      await page
        .getByRole('combobox', { name: 'Modalidad', exact: true })
        .selectOption('written');
      await expect(
        page.getByText(/^Responde cada parte por separado\./),
      ).toBeVisible();
      await expect(page.getByRole('textbox')).toHaveCount(4);
      await page
        .locator('.exercise-panel')
        .screenshot({ path: `artifacts/ux-escritura-${suffix}.png` });
    }
  }
});

test('opciones completas sin campos regalados y compresión equivalente', async ({
  page,
}) => {
  await page.goto('/practicar/13');
  const choices = page.locator('.choice > span:last-child');
  await expect(choices).toHaveCount(4);
  const fields = (await choices.allTextContents()).map((label) =>
    label.split(' · ').map((field) => field.split(': ')[1]),
  );
  for (let part = 0; part < 4; part++)
    expect(new Set(fields.map((choice) => choice[part])).size).toBe(4);
  await page
    .getByRole('button', {
      name: /Sin signo: 240 · Magnitud y signo: -112 · C1: -15 · C2: -16/,
    })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Correcto', exact: true }),
  ).toBeVisible();
  await page.goto('/practicar/21');
  await page
    .getByRole('combobox', { name: 'Ejercicio', exact: true })
    .selectOption('3');
  await page
    .getByRole('combobox', { name: 'Modalidad', exact: true })
    .selectOption('written');
  const answer = page.getByRole('textbox', { name: 'Compresión', exact: true });
  await answer.fill('sin pérdidas o con pérdidas');
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'No es correcto', exact: true }),
  ).toBeVisible();
  await answer.fill('  Compresión SIN PÉRDIDAS. ');
  await page.getByRole('button', { name: 'Comprobar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Correcto', exact: true }),
  ).toBeVisible();
});

test('Otro ejercicio lleva foco y vista al encabezado con teclado y ratón', async ({
  page,
  browserName,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto('/practicar/13');
    for (const position of [2, 3, 4, 1]) {
      const next = page.getByRole('button', {
        name: 'Otro ejercicio',
        exact: true,
      });
      if (width === 1440) {
        await next.focus();
        await page.keyboard.press('Enter');
      } else await next.click();
      const heading = page.getByRole('heading', {
        name: `Ejercicio ${position} de 4`,
        exact: true,
      });
      await expect(heading).toBeFocused();
      await expect(heading).toBeInViewport({ ratio: 1 });
      await expect(page.locator('.exercise-prompt')).toBeInViewport();
      const bounds = await heading.boundingBox();
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      if (width === 390 && position === 2)
        await page.screenshot({
          path: `artifacts/regression-next-${browserName}.png`,
        });
      await page.keyboard.press('Tab');
      await expect(page.locator('.choice').first()).toBeFocused();
    }
    const mode = page.getByRole('combobox', { name: 'Modalidad', exact: true });
    await mode.focus();
    await mode.selectOption('written');
    await expect(mode).toBeFocused();
    const selector = page.getByRole('combobox', {
      name: 'Ejercicio',
      exact: true,
    });
    await selector.focus();
    await selector.selectOption('1');
    await expect(selector).toBeFocused();
  }
});

test('BCD asocia errores persistentes y retira la invalidez al corregir o vaciar', async ({
  page,
  browserName,
}) => {
  await page.goto('/aprender/bcd');
  const digits = page.getByRole('textbox', {
    name: 'Cifras decimales',
    exact: true,
  });
  await digits.fill('A');
  await expect(digits).toHaveAttribute('aria-invalid', 'true');
  await expect(digits).toHaveAccessibleDescription(
    /Introduce entre 1 y 64 cifras decimales/,
  );
  const error = page
    .getByRole('status')
    .filter({ hasText: 'Introduce entre 1 y 64 cifras decimales.' });
  await expect(error).toHaveCount(1);
  await expect(error).toHaveAttribute('aria-atomic', 'true');
  await page
    .getByRole('region', { name: 'Demostración interactiva' })
    .screenshot({ path: `artifacts/regression-bcd-${browserName}.png` });
  await digits.fill('95');
  await expect(digits).toHaveAttribute('aria-invalid', 'false');
  await expect(error).toHaveCount(0);
  await expect(page.getByText('1001 0101', { exact: true })).toBeVisible();
  const bits = page.getByRole('textbox', { name: 'Grupos BCD', exact: true });
  await bits.fill('1010');
  await expect(bits).toHaveAttribute('aria-invalid', 'true');
  await expect(bits).toHaveAccessibleDescription(
    /El grupo 1010 no es una cifra BCD/,
  );
  await bits.fill('001');
  await expect(bits).toHaveAccessibleDescription(/BCD exige grupos completos/);
  await bits.fill('');
  await expect(bits).toHaveAttribute('aria-invalid', 'false');
  await expect(
    page.getByRole('status').filter({ hasText: /BCD exige|El grupo/ }),
  ).toHaveCount(0);
  await bits.fill('0000 1001');
  await expect(
    page
      .getByRole('region', { name: 'Demostración interactiva' })
      .getByText('09', { exact: true }),
  ).toBeVisible();
});

test('Otro ejercicio por toque conserva el nuevo encabezado visible', async ({
  browser,
  browserName,
  baseURL,
}) => {
  test.skip(
    browserName === 'firefox',
    'La emulación isMobile no está disponible en Firefox.',
  );
  const context = await browser.newContext({
    viewport: { width: 390, height: 700 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: 'reduce',
  });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/practicar/13`);
    await page
      .getByRole('button', { name: 'Otro ejercicio', exact: true })
      .tap();
    const heading = page.getByRole('heading', {
      name: 'Ejercicio 2 de 4',
      exact: true,
    });
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport({ ratio: 1 });
    await expect(page.locator('.exercise-prompt')).toBeInViewport();
  } finally {
    await context.close();
  }
});
