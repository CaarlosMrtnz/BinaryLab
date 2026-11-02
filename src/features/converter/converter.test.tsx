import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import ConverterPage from './ConverterPage';
function setup() {
  render(
    <MemoryRouter>
      <ConverterPage />
    </MemoryRouter>,
  );
  return userEvent.setup();
}
describe('conversor real', () => {
  it('presenta el editor de bits como sección H2 del conversor', () => {
    setup();
    expect(
      screen.getByRole('heading', { name: 'Explora los bits', level: 2 }),
    ).toBeVisible();
    const levels = screen
      .getAllByRole('heading')
      .map((heading) => Number(heading.tagName[1]));
    expect(levels[0]).toBe(1);
    for (let index = 1; index < levels.length; index++)
      expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
  });
  it('mantiene enteros de 200 cifras al convertirlos a más de 256 bits', async () => {
    const user = setup();
    await user.click(screen.getByRole('tab', { name: 'Decimal' }));
    const input = screen.getByLabelText(/Número en decimal/),
      digits = '9'.repeat(200);
    fireEvent.change(input, { target: { value: digits } });
    await user.click(screen.getByRole('tab', { name: 'Binario' }));
    expect(screen.getByTestId('result-10')).toHaveTextContent(digits);
    expect(screen.getByLabelText(/Número en binario/)).toHaveValue(
      BigInt(digits).toString(2),
    );
    await user.click(screen.getByRole('tab', { name: 'Decimal' }));
    expect(screen.getByLabelText(/Número en decimal/)).toHaveValue(digits);
  });
  it('una modificación de bits limpia el aviso de una tecla rechazada', async () => {
    const user = setup();
    await user.click(screen.getByLabelText(/Número en binario/));
    await user.keyboard('2');
    await user.click(
      screen.getByRole('button', { name: 'Bit 0, peso 1, activado' }),
    );
    expect(
      screen.queryByText('En binario solo puedes escribir 0 y 1.'),
    ).not.toBeInTheDocument();
  });
  it('conserva valor al cambiar de base y actualiza al escribir', async () => {
    const user = setup();
    expect(screen.getByTestId('result-10')).toHaveTextContent('149');
    await user.click(screen.getByRole('tab', { name: 'Hexadecimal' }));
    const input = screen.getByLabelText(/Número en hexadecimal/);
    expect(input).toHaveValue('95');
    await user.clear(input);
    await user.type(input, 'a5');
    expect(input).toHaveValue('A5');
    expect(screen.getByTestId('result-10')).toHaveTextContent('165');
    expect(screen.getByTestId('result-8')).toHaveTextContent('245');
  });
  it('rechaza tecla y pegado completos, permite vacío y navegación', async () => {
    const user = setup(),
      input = screen.getByLabelText(/Número en binario/);
    await user.click(input);
    await user.keyboard('2');
    expect(input).toHaveValue('10010101');
    expect(
      screen.getByText('En binario solo puedes escribir 0 y 1.'),
    ).toBeVisible();
    expect(input).toHaveAttribute('aria-invalid', 'false');
    await user.paste('10x1');
    expect(input).toHaveValue('10010101');
    await user.clear(input);
    expect(input).toHaveValue('');
    expect(screen.getByTestId('result-10')).toHaveTextContent('—');
    await user.click(screen.getByRole('tab', { name: 'Octal' }));
    expect(screen.getByLabelText(/Número en octal/)).toHaveValue('');
  });
  it('modifica bit, pasos y rango sin truncar', async () => {
    const user = setup();
    await user.click(
      screen.getByRole('button', { name: 'Bit 0, peso 1, activado' }),
    );
    expect(screen.getByTestId('result-10')).toHaveTextContent('148');
    await user.click(screen.getByRole('tab', { name: 'Pasos' }));
    expect(
      screen.getByText(
        'Comprobación: ambas representaciones valen 148 en decimal.',
      ),
    ).toBeVisible();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Ancho en bits' }),
      '4',
    );
    expect(screen.getByText(/necesita 8 bits y no cabe en 4/)).toBeVisible();
    expect(screen.getByTestId('result-10')).toHaveTextContent('148');
    await user.click(screen.getByRole('button', { name: 'Restablecer' }));
    expect(screen.getByTestId('result-10')).toHaveTextContent('149');
  });
  it('valida el resultado al terminar composición IME', () => {
    setup();
    const input = screen.getByLabelText(/Número en binario/);
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: '二' } });
    expect(input).toHaveValue('二');
    fireEvent.compositionEnd(input, { target: { value: '二' } });
    expect(input).toHaveValue('10010101');
    expect(screen.getByTestId('result-10')).toHaveTextContent('149');
  });
  it('no confirma copia cuando falla el permiso', async () => {
    const user = setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    await user.click(screen.getByRole('button', { name: 'Copiar decimal' }));
    expect(screen.getByText(/No se pudo copiar/)).toBeInTheDocument();
    expect(screen.queryByText('Copiado')).not.toBeInTheDocument();
  });
});
