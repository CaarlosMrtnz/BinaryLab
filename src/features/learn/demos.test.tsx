import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { TopicDemo } from './TopicDemo';
import LearnPage from './LearnPage';

describe('demostraciones con procedimientos reales', () => {
  it('Signed asocia un único anuncio de formato y recupera el estado válido o vacío', async () => {
    const user = userEvent.setup();
    render(<TopicDemo kind="signed" />);
    const input = screen.getByRole('textbox', { name: 'Entero con signo' });
    const region = document.getElementById(
      input.getAttribute('aria-describedby') ?? '',
    );
    expect(region).toHaveAttribute('role', 'status');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(input).not.toBeInvalid();
    await user.clear(input);
    await user.type(input, 'abc');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Introduce un entero.');
    expect(
      screen.getAllByRole('status').filter((node) => node.textContent !== ''),
    ).toEqual([region]);
    expect(
      region?.parentElement?.closest('[aria-live], [role="status"]'),
    ).toBeNull();
    await user.clear(input);
    expect(input).not.toBeInvalid();
    expect(region).toBeEmptyDOMElement();
    await user.type(input, '-18');
    expect(input).not.toBeInvalid();
    expect(input).toHaveAccessibleDescription('');
    expect(screen.getByText('Sumar 1: 11101110')).toBeVisible();
  });
  it('Signed distingue los rangos por formato y revalida al cambiar el ancho', async () => {
    const user = userEvent.setup();
    render(<TopicDemo kind="signed" />);
    const input = screen.getByRole('textbox', { name: 'Entero con signo' });
    await user.clear(input);
    await user.type(input, '999');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(/C2: Fuera de rango: -128…127\./);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Ancho' }),
      '16',
    );
    expect(input).not.toBeInvalid();
    expect(input).toHaveAccessibleDescription('');
    await user.clear(input);
    await user.type(input, '-128');
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Ancho' }),
      '8',
    );
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(
      'Magnitud y signo: Fuera de rango: -127…127. C1: Fuera de rango: -127…127.',
    );
    expect(screen.getByText('Sumar 1: 10000000')).toBeVisible();
    await user.clear(input);
    await user.type(input, '0');
    expect(input).not.toBeInvalid();
    expect(input).toHaveAccessibleDescription('');
  });
  it('Signed relaciona el error de patrón y lo retira al corregir o vaciar', async () => {
    const user = userEvent.setup();
    render(<TopicDemo kind="signed" />);
    const input = screen.getByRole('textbox', {
      name: 'Interpreta un patrón (2–64 bits)',
    });
    const region = document.getElementById(
      input.getAttribute('aria-describedby') ?? '',
    );
    expect(region).toHaveAttribute('role', 'status');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    await user.clear(input);
    await user.type(input, '102');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(
      'Introduce un patrón de 2 a 64 bits.',
    );
    expect(
      screen.getAllByRole('status').filter((node) => node.textContent !== ''),
    ).toEqual([region]);
    await user.clear(input);
    expect(input).not.toBeInvalid();
    expect(region).toBeEmptyDOMElement();
    await user.type(input, '1');
    expect(input).toBeInvalid();
    await user.type(input, '0');
    expect(input).not.toBeInvalid();
    expect(input).toHaveAccessibleDescription('');
  });
  it('Signed mantiene identificadores y errores independientes entre instancias', async () => {
    const user = userEvent.setup();
    render(
      <>
        <TopicDemo kind="signed" />
        <TopicDemo kind="signed" />
      </>,
    );
    const inputs = screen.getAllByRole('textbox');
    const ids = inputs.map((input) => input.getAttribute('aria-describedby'));
    expect(new Set(ids).size).toBe(4);
    for (const id of ids)
      expect(document.getElementById(id ?? '')).toHaveAttribute(
        'role',
        'status',
      );
    const values = screen.getAllByRole('textbox', { name: 'Entero con signo' });
    await user.clear(values[0]);
    await user.type(values[0], 'abc');
    expect(values[0]).toBeInvalid();
    expect(values[1]).not.toBeInvalid();
    expect(
      screen.getAllByRole('status').filter((node) => node.textContent !== ''),
    ).toHaveLength(1);
  });
  it.each(['compresion', 'complemento-a-dos'])(
    'el aviso de %s mantiene una jerarquía de encabezados continua',
    (slug) => {
      render(
        <MemoryRouter initialEntries={['/aprender/' + slug]}>
          <Routes>
            <Route path="/aprender/:topic" element={<LearnPage />} />
          </Routes>
        </MemoryRouter>,
      );
      expect(
        screen.getByRole('heading', { name: 'Evita este error', level: 2 }),
      ).toBeVisible();
      const levels = screen
        .getAllByRole('heading')
        .map((heading) => Number(heading.tagName[1]));
      expect(levels[0]).toBe(1);
      for (let index = 1; index < levels.length; index++)
        expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
    },
  );
  it('BCD decimal relaciona y anuncia una sola vez el error y lo retira al corregir o vaciar', async () => {
    const user = userEvent.setup();
    render(<TopicDemo kind="bcd" />);
    const input = screen.getByRole('textbox', { name: 'Cifras decimales' });
    await user.clear(input);
    expect(input).not.toBeInvalid();
    await user.type(input, 'A');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(
      /Introduce entre 1 y 64 cifras decimales/,
    );
    const error = screen.getByText('Introduce entre 1 y 64 cifras decimales.');
    const region = error.closest('[role="status"]');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(screen.getAllByText(error.textContent!)).toHaveLength(1);
    await user.clear(input);
    expect(input).not.toBeInvalid();
    expect(region).toBeEmptyDOMElement();
    await user.type(input, '95');
    expect(screen.getByText('1001 0101')).toBeVisible();
    expect(input).not.toHaveAccessibleDescription(/Introduce entre/);
  });
  it('BCD inverso distingue grupos incompletos, nibbles inválidos y ceros iniciales', async () => {
    const user = userEvent.setup();
    render(<TopicDemo kind="bcd" />);
    const input = screen.getByRole('textbox', { name: 'Grupos BCD' });
    await user.clear(input);
    await user.type(input, '1010');
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription(
      /El grupo 1010 no es una cifra BCD/,
    );
    await user.clear(input);
    await user.type(input, '001');
    expect(input).toHaveAccessibleDescription(/BCD exige grupos completos/);
    await user.clear(input);
    expect(input).not.toBeInvalid();
    expect(
      screen.getAllByRole('status').every((node) => node.textContent === ''),
    ).toBe(true);
    await user.type(input, '0000 1001');
    expect(input).not.toBeInvalid();
    expect(screen.getByText('09')).toBeVisible();
  });
  it('muestra suma completa, resta con préstamo y NOT sin truncar el valor matemático', async () => {
    const user = userEvent.setup();
    render(<TopicDemo kind="operation" />);
    const a = screen.getByRole('textbox', { name: 'Operando A (0–255)' }),
      b = screen.getByRole('textbox', { name: 'Operando B (0–255)' });
    await user.clear(a);
    await user.type(a, '255');
    await user.clear(b);
    await user.type(b, '1');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Resultado matemático: 256',
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Patrón de ocho bits: 00000000',
    );
    expect(
      screen.getByRole('table', { name: 'Desarrollo columna a columna' }),
    ).toBeVisible();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Operación' }),
      'subtract',
    );
    await user.clear(a);
    await user.type(a, '0');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Resultado matemático: -1',
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Préstamo exterior: 1',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Operación' }),
      'not',
    );
    expect(b).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Patrón de ocho bits: 11111111',
    );
  });
  it('calcula los tres pasos C2 para el valor editado', async () => {
    const user = userEvent.setup();
    render(<TopicDemo kind="signed" />);
    const input = screen.getByLabelText('Entero con signo');
    await user.clear(input);
    await user.type(input, '-18');
    const steps = screen.getByRole('list');
    expect(within(steps).getByText('Magnitud: 00010010')).toBeVisible();
    expect(within(steps).getByText('Inversión: 11101101')).toBeVisible();
    expect(within(steps).getByText('Sumar 1: 11101110')).toBeVisible();
  });
  it('inicia IEEE en −19,6875 y conserva el valor al cambiar de formato', async () => {
    const user = userEvent.setup();
    render(<TopicDemo kind="ieee" />);
    expect(screen.getByRole('combobox', { name: 'Ejemplo' })).toHaveValue(
      '-19.6875',
    );
    expect(
      screen.queryByRole('option', { name: '-148.421875' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Hex: C19D8000/)).toBeVisible();
    expect(screen.getByText(/Valor almacenado: -19.6875/)).toBeVisible();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Formato' }),
      '64',
    );
    expect(screen.getByText(/Hex: C033B00000000000/)).toBeVisible();
    expect(screen.getByText(/Valor almacenado: -19.6875/)).toBeVisible();
  });
  it('el ejemplo subnormal sigue siendo subnormal al cambiar a binary64', async () => {
    const user = userEvent.setup();
    render(<TopicDemo kind="ieee" />);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Ejemplo' }),
      'subnormal',
    );
    expect(screen.getByText(/Clase: subnormal/)).toBeVisible();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Formato' }),
      '64',
    );
    expect(screen.getByText(/Clase: subnormal/)).toBeVisible();
    expect(screen.getByText(/Hex: 0000000000000001/)).toBeVisible();
  });
});
