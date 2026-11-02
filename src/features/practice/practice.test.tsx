import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import PracticePage from './PracticePage';
function setup(id = '02') {
  render(
    <MemoryRouter initialEntries={['/practicar/' + id]}>
      <Routes>
        <Route path="/practicar/:category" element={<PracticePage />} />
      </Routes>
    </MemoryRouter>,
  );
  return userEvent.setup();
}
describe('práctica sin revelación prematura', () => {
  it('distingue la selección de una alternativa completa de la respuesta escrita por partes', async () => {
    const user = setup('13');
    const quiz = /^Elige una alternativa que resuelva todas las partes\./;
    const written = /^Responde cada parte por separado\./;
    expect(screen.getByText(quiz)).toBeVisible();
    expect(screen.queryByText(written)).not.toBeInTheDocument();
    const mode = screen.getByRole('combobox', { name: 'Modalidad' });
    await user.selectOptions(mode, 'written');
    expect(screen.getByText(written)).toBeVisible();
    expect(screen.queryByText(quiz)).not.toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
    await user.selectOptions(mode, 'quiz');
    expect(screen.getByText(quiz)).toBeVisible();
    expect(screen.queryByText(written)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Sin signo:/ })).toHaveLength(
      4,
    );
  });
  it('Otro ejercicio enfoca la actividad nueva sin robar el foco al selector de modalidad', async () => {
    const user = setup();
    expect(
      screen.getByRole('heading', { name: 'Ejercicio 1 de 4' }),
    ).not.toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Otro ejercicio' }));
    expect(
      screen.getByRole('heading', { name: 'Ejercicio 2 de 4' }),
    ).toHaveFocus();
    const mode = screen.getByRole('combobox', { name: 'Modalidad' });
    await user.selectOptions(mode, 'written');
    expect(mode).toHaveFocus();
    await user.type(screen.getByRole('textbox', { name: 'Decimal' }), '999');
    await user.click(screen.getByRole('button', { name: 'Otro ejercicio' }));
    expect(
      screen.getByRole('heading', { name: 'Ejercicio 3 de 4' }),
    ).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Decimal' })).toHaveValue('');
    expect(screen.queryByText('Solución y desarrollo')).not.toBeInTheDocument();
  });
  it('ofrece pistas de método antes del desarrollo solicitado explícitamente', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'Pedir pista' }));
    expect(
      screen.getByText('Numera las posiciones desde cero por la derecha.'),
    ).toBeVisible();
    expect(screen.queryByText('Solución y desarrollo')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Otra pista' }));
    await user.click(
      screen.getByRole('button', { name: 'Mostrar desarrollo y solución' }),
    );
    expect(
      screen.getByText(/Solución consultada antes de responder/),
    ).toBeVisible();
    await user.click(screen.getByRole('tab', { name: 'Pasos' }));
    expect(screen.getByText('Solución y desarrollo')).toBeVisible();
  });
  it('oculta el desarrollo, corrige opción y permite reintentar', async () => {
    const user = setup();
    await user.click(screen.getByRole('tab', { name: 'Pasos' }));
    expect(screen.queryByText(/128\+32\+16\+4\+2=182/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Decimal: 183/ }));
    expect(
      screen.getByRole('heading', { name: 'No es correcto' }),
    ).toBeVisible();
    expect(screen.getByText('Solución y desarrollo')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(screen.queryByText('Solución y desarrollo')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Decimal: 182/ }));
    expect(screen.getByRole('heading', { name: 'Correcto' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Otro ejercicio' }));
    expect(screen.getByText('ID 02.2')).toBeVisible();
    expect(screen.queryByText('Solución y desarrollo')).not.toBeInTheDocument();
  });
  it('escritura equivalente, error de formato y respuesta errónea', async () => {
    const user = setup();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Modalidad' }),
      'written',
    );
    const input = screen.getByRole('textbox', { name: 'Decimal' });
    await user.type(input, 'G');
    await user.click(screen.getByRole('button', { name: 'Comprobar' }));
    expect(
      screen.getByRole('heading', { name: 'Revisa el formato' }),
    ).toBeVisible();
    await user.clear(input);
    await user.type(input, '183');
    await user.click(screen.getByRole('button', { name: 'Comprobar' }));
    expect(
      screen.getByRole('heading', { name: 'No es correcto' }),
    ).toBeVisible();
    await user.clear(input);
    await user.type(input, '000182');
    await user.click(screen.getByRole('button', { name: 'Comprobar' }));
    expect(screen.getByRole('heading', { name: 'Correcto' })).toBeVisible();
  });
  it('revelar antes de responder se identifica como consulta', async () => {
    const user = setup();
    await user.click(screen.getByRole('tab', { name: 'Pasos' }));
    await user.click(screen.getByRole('button', { name: 'Mostrar solución' }));
    expect(
      screen.getByText(/Solución consultada antes de responder/),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: /Decimal: 182/ })).toBeDisabled();
  });
});
