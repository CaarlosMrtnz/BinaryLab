import { useState } from 'react';
import { ArrowRightLeft, RotateCcw, Info, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import {
  BASES,
  BASE_NAMES,
  SUBS,
  binaryWidth,
  conversion,
  formatUnsigned,
  parseUnsigned,
  requiredBits,
  type Base,
  type Width,
} from '@/domain/numerals';
import { ContextPanel } from '@/components/ContextPanel';
import { CopyButton } from '@/components/CopyButton';
import { Tabs } from '@/components/ui/Tabs';
import { NumberInput } from './NumberInput';
import { BitEditor } from './BitEditor';

export default function ConverterPage() {
  const [base, setBase] = useState<Base>(2),
    [raw, setRaw] = useState('10010101'),
    [width, setWidth] = useState<Width>('auto'),
    [target, setTarget] = useState<Base>(10),
    [inputRevision, setInputRevision] = useState(0);
  const parsed = parseUnsigned(raw, base, 1024),
    value = parsed.ok ? parsed.value : null;
  const needed = value === null ? 0 : requiredBits(value);
  const visibleWidth =
    width === 'auto' ? Math.max(8, needed, base === 2 ? raw.length : 0) : width;
  const pattern = value === null ? null : binaryWidth(value, visibleWidth);
  const rangeError = pattern && !pattern.ok ? pattern.error : undefined;
  const detail = value === null ? null : conversion(value, base, target);
  function changeBase(next: string) {
    const b = Number(next) as Base;
    setRaw(value === null ? '' : formatUnsigned(value, b));
    setBase(b);
    setTarget(b === 10 ? 2 : 10);
  }
  function reset() {
    setInputRevision((r) => r + 1);
    setBase(2);
    setRaw('10010101');
    setWidth('auto');
    setTarget(10);
  }
  const input = (
    <>
      <div className="editor-toolbar">
        <span className="chip">Entero sin signo</span>
        <label className="width-label">
          Ancho
          <select
            aria-label="Ancho en bits"
            value={width}
            onChange={(e) => {
              setInputRevision((r) => r + 1);
              setWidth(
                e.target.value === 'auto'
                  ? 'auto'
                  : (Number(e.target.value) as Width),
              );
            }}
          >
            {['auto', 4, 8, 16, 32, 64].map((w) => (
              <option key={w} value={w}>
                {w === 'auto' ? 'Automático' : `${w} bits`}
              </option>
            ))}
          </select>
        </label>
      </div>
      <NumberInput
        key={`${base}-${inputRevision}`}
        base={base}
        raw={raw}
        onChange={setRaw}
        rangeError={rangeError}
      />
      {base === 2 &&
        pattern?.ok &&
        (visibleWidth <= 64 ? (
          <BitEditor
            bits={pattern.value}
            onToggle={(position) => {
              setInputRevision((r) => r + 1);
              setRaw(
                (value! ^ (1n << BigInt(position)))
                  .toString(2)
                  .padStart(visibleWidth, '0'),
              );
            }}
          />
        ) : (
          <p className="notice">
            <Info size={18} aria-hidden />
            Conversión textual exacta de {needed} bits. El editor de botones
            admite hasta 64 bits.
          </p>
        ))}
      {base === 2 && rangeError && (
        <p className="muted">
          Selecciona Automático o un ancho suficiente para volver a editar los
          bits.
        </p>
      )}
    </>
  );
  return (
    <div className="workspace">
      <section className="work-main" aria-labelledby="page-title">
        <div className="page-heading">
          <p className="eyebrow">
            <ArrowRightLeft size={15} aria-hidden /> LABORATORIO DE NÚMEROS
          </p>
          <h1 id="page-title">
            Conversor de bases<span className="title-dot">.</span>
          </h1>
          <p>
            Escribe un número o modifica sus bits para ver las equivalencias al
            instante.
          </p>
        </div>
        <div className="panel converter-panel">
          <Tabs
            value={String(base)}
            onChange={changeBase}
            label="Base de entrada"
            items={BASES.map((b) => ({
              value: String(b),
              label: BASE_NAMES[b],
              content: input,
            }))}
          />
          <div className="editor-footer">
            <span>
              <span className="status-dot" /> Cálculo exacto · en tu navegador
            </span>
            <button className="text-button" onClick={reset}>
              <RotateCcw size={15} aria-hidden />
              Restablecer
            </button>
          </div>
        </div>
        <div className="section-label results-heading">
          <h2>Un valor, cuatro representaciones</h2>
          <span>Elige una para ver sus pasos</span>
        </div>
        <div className="results-grid">
          {BASES.map((b) => {
            const text = value === null ? '' : formatUnsigned(value, b);
            return (
              <div
                key={b}
                className={`result-card ${base === b ? 'input-base' : ''} ${target === b ? 'detail-base' : ''}`}
              >
                <div className="result-top">
                  <span className="base-tag">
                    {b === 2
                      ? 'BIN'
                      : b === 10
                        ? 'DEC'
                        : b === 16
                          ? 'HEX'
                          : 'OCT'}
                  </span>
                  <CopyButton
                    key={text}
                    value={text}
                    label={BASE_NAMES[b].toLowerCase()}
                  />
                </div>
                <button
                  className="result-select"
                  aria-label={`Ver pasos a ${BASE_NAMES[b].toLowerCase()}`}
                  aria-pressed={target === b}
                  onClick={() => setTarget(b)}
                >
                  <span className="result-name">
                    {BASE_NAMES[b]} <span className="muted">/ base {b}</span>
                  </span>
                  <span
                    data-testid={`result-${b}`}
                    className={`result-value ${text.length <= 10 && b !== 2 ? 'display-number' : ''}`}
                  >
                    {text || '—'}
                    <sub>{SUBS[b]}</sub>
                  </span>
                  <span className="result-foot">
                    {base === b ? 'Base de entrada' : 'Ver procedimiento'}
                    <ArrowUpRight size={15} aria-hidden />
                  </span>
                </button>
              </div>
            );
          })}
        </div>
        <p className="quiet-note">
          <Info size={16} aria-hidden />
          El ancho cambia la representación, nunca el valor. Los formatos con
          signo se exploran en{' '}
          <Link to="/aprender/complemento-a-dos">Aprender</Link>.
        </p>
      </section>
      <ContextPanel
        title={`${BASE_NAMES[base]} → ${BASE_NAMES[target]}`}
        explanation={
          <>
            <h3>{detail?.method ?? 'Empieza con un número'}</h3>
            <p>
              {detail?.explanation ??
                'Al escribir una entrada válida, aquí podrás seguir su conversión.'}
            </p>
            {value !== null && (
              <div className="worked-value">
                <span>Equivalencia actual</span>
                <code>
                  {formatUnsigned(value, base)}
                  {SUBS[base]} = {formatUnsigned(value, target)}
                  {SUBS[target]}
                </code>
              </div>
            )}
            <p className="muted small">
              La base indica qué símbolos se usan y cuánto pesa cada posición.
            </p>
            <Link className="inline-link" to="/aprender/binario-a-decimal">
              Entender el valor posicional <ArrowUpRight size={15} />
            </Link>
          </>
        }
        steps={
          detail ? (
            <>
              <h3>{detail.method}</h3>
              <ol className="calculation-steps">
                {detail.steps.map((step, i) => (
                  <li key={i}>
                    <span>{step.text}</span>
                    <code>{step.result}</code>
                  </li>
                ))}
              </ol>
              <p className="verification">
                Comprobación: ambas representaciones valen {value?.toString()}{' '}
                en decimal.
              </p>
            </>
          ) : (
            <p>Introduce un número para ver sus pasos.</p>
          )
        }
        formula={
          <>
            <h3>Regla y variables</h3>
            <p className="formula">{detail?.formula ?? 'N = Σ dᵢ × Bⁱ'}</p>
            <p>
              Las conversiones entre bases de enteros son exactas y no requieren
              redondeo.
            </p>
          </>
        }
      />
    </div>
  );
}
