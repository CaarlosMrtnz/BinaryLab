import { useId, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { TopicMeta } from '@/content/catalog';
import { groupBits, parseUnsigned } from '@/domain/numerals';
import { arithmeticColumns, type BinaryOperation } from '@/domain/arithmetic';
import {
  decodeBCD,
  decodeSigned,
  encodeBCD,
  encodeSigned,
  fractionToBinary,
  ieee,
  parseRational,
  rgbHex,
  type SignedMode,
} from '@/domain/representations';

function Counter() {
  const [n, setN] = useState(15n),
    [previous, setPrevious] = useState('');
  const update = (delta: bigint) => {
    const result = (n + delta + 256n) % 256n;
    setPrevious(
      `${n} ${delta > 0n ? '+' : '−'} 1 = ${n + delta}; patrón almacenado módulo 256: ${result}. ${n === 255n && delta > 0n ? 'Acarreo exterior 1.' : n === 0n && delta < 0n ? 'Préstamo exterior: retorno circular.' : ''}`,
    );
    setN(result);
  };
  return (
    <>
      <p>Contador sin signo de ocho bits con retorno circular explícito.</p>
      <div className="demo-output">
        {n.toString(2).padStart(8, '0')}₂ = {n.toString()}₁₀
      </div>
      <div className="actions">
        <button className="button" onClick={() => update(-1n)}>
          <Minus size={16} />
          Restar 1
        </button>
        <button className="button primary" onClick={() => update(1n)}>
          <Plus size={16} />
          Sumar 1
        </button>
      </div>
      <p role="status" className="format-note">
        {previous}
      </p>
    </>
  );
}
function Signed() {
  const id = useId();
  const [raw, setRaw] = useState('-59'),
    [width, setWidth] = useState(8),
    [bits, setBits] = useState('10000011');
  const valid = /^-?\d{1,20}$/.test(raw),
    value = valid ? BigInt(raw) : null;
  const magnitude =
    value !== null && value < 0n
      ? (-value).toString(2).padStart(width, '0')
      : '';
  const inverted = [...magnitude]
    .map((bit) => (bit === '1' ? '0' : '1'))
    .join('');
  const modes: { id: SignedMode; label: string }[] = [
    { id: 'magnitude', label: 'Magnitud y signo' },
    { id: 'ones', label: 'C1' },
    { id: 'twos', label: 'C2' },
  ];
  const representations = modes.map((mode) => ({
    ...mode,
    encoded: value === null ? null : encodeSigned(value, width, mode.id),
    decoded: decodeSigned(bits, mode.id),
  }));
  const twos = representations.find((mode) => mode.id === 'twos');
  const valueError =
    raw === ''
      ? ''
      : value === null
        ? 'Introduce un entero.'
        : representations
            .flatMap(({ label, encoded }) =>
              encoded && !encoded.ok ? [`${label}: ${encoded.error}`] : [],
            )
            .join(' ');
  const bitsError =
    bits.trim() !== '' && twos && !twos.decoded.ok ? twos.decoded.error : '';
  return (
    <>
      <div className="demo-grid">
        <label>
          Entero con signo
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            aria-invalid={!!valueError}
            aria-describedby={`${id}-value-error`}
          />
        </label>
        <label>
          Ancho
          <select
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          >
            {[4, 8, 16, 32, 64].map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </label>
      </div>
      <div
        id={`${id}-value-error`}
        role="status"
        aria-atomic="true"
        className="sr-only"
      >
        {valueError}
      </div>
      <div className="demo-output">
        {representations.map(({ id, label, encoded }) => (
          <div key={id}>
            <span className="label">{label}:</span>
            {encoded
              ? encoded.ok
                ? encoded.value
                : encoded.error
              : 'Introduce un entero.'}
          </div>
        ))}
        {value !== null && value < 0n && twos?.encoded?.ok && (
          <div>
            <span className="label">Método C2, {width} bits:</span>
            <ol>
              <li>Magnitud: {magnitude}</li>
              <li>Inversión: {inverted}</li>
              <li>Sumar 1: {twos.encoded.value}</li>
            </ol>
          </div>
        )}
      </div>
      <label>
        Interpreta un patrón (2–64 bits)
        <input
          value={bits}
          onChange={(e) => setBits(e.target.value)}
          maxLength={64}
          aria-invalid={!!bitsError}
          aria-describedby={`${id}-bits-error`}
        />
      </label>
      <div
        id={`${id}-bits-error`}
        role="status"
        aria-atomic="true"
        className="sr-only"
      >
        {bitsError}
      </div>
      <div className="demo-output">
        {representations.map(({ id, label, decoded }) => (
          <div key={id}>
            <span className="label">{label}:</span>
            {decoded.ok
              ? decoded.value.negativeZero
                ? '−0 (valor matemático 0)'
                : decoded.value.value.toString()
              : decoded.error}
          </div>
        ))}
      </div>
    </>
  );
}
function BCD() {
  const id = useId();
  const [digits, setDigits] = useState('6749'),
    [bits, setBits] = useState('0011 1001 0101');
  const encoded = encodeBCD(digits),
    decoded = decodeBCD(bits);
  const digitsError = digits !== '' && !encoded.ok ? encoded.error : '';
  const bitsError = bits.trim() !== '' && !decoded.ok ? decoded.error : '';
  return (
    <>
      <label>
        Cifras decimales
        <input
          id={`${id}-digits`}
          value={digits}
          onChange={(e) => setDigits(e.target.value)}
          maxLength={64}
          inputMode="numeric"
          aria-invalid={!!digitsError}
          aria-describedby={`${id}-digits-help ${id}-digits-error`}
        />
      </label>
      <p id={`${id}-digits-help`} className="format-note">
        Hasta 64 cifras del 0 al 9, sin separadores.
      </p>
      <div id={`${id}-digits-error`} role="status" aria-atomic="true">
        {digitsError && <p className="notice error">{digitsError}</p>}
      </div>
      {encoded.ok && <div className="demo-output">{encoded.value}</div>}
      <label>
        Grupos BCD
        <input
          id={`${id}-bits`}
          value={bits}
          onChange={(e) => setBits(e.target.value)}
          maxLength={320}
          aria-invalid={!!bitsError}
          aria-describedby={`${id}-bits-help ${id}-bits-error`}
        />
      </label>
      <p id={`${id}-bits-help`} className="format-note">
        Grupos completos de cuatro bits. Puedes separarlos con espacios.
      </p>
      <div id={`${id}-bits-error`} role="status" aria-atomic="true">
        {bitsError && <p className="notice error">{bitsError}</p>}
      </div>
      {decoded.ok && <div className="demo-output">{decoded.value}</div>}
      <p className="format-note">
        Cada cifra conserva su grupo de cuatro bits, incluidos ceros iniciales.
      </p>
    </>
  );
}
function Fraction() {
  const [raw, setRaw] = useState('0,375'),
    [precision, setPrecision] = useState(12);
  const parsed = parseRational(raw),
    result = parsed.ok ? fractionToBinary(parsed.value, precision) : null;
  return (
    <>
      <div className="demo-grid">
        <label>
          Decimal exacto o fracción
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            maxLength={64}
          />
        </label>
        <label>
          Bits fraccionarios
          <select
            value={precision}
            onChange={(e) => setPrecision(Number(e.target.value))}
          >
            {[6, 12, 16, 32, 64].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      {result ? (
        <>
          <div className="demo-output">
            {result.binary}
            {!result.exact && '…'}₂<br />
            <span className="label">
              {result.exact
                ? 'Exacto.'
                : `Aproximación truncada a ${precision} bits; no redondeada.`}{' '}
              {result.repeatAt !== null &&
                `Período detectado desde la posición ${result.repeatAt + 1}.`}
            </span>
          </div>
          <details className="format-note">
            <summary>Ver multiplicaciones exactas</summary>
            <ol>
              {result.steps.map((step, i) => (
                <li key={i}>
                  <code>{step}</code>
                </li>
              ))}
            </ol>
          </details>
        </>
      ) : (
        <p className="notice error">{!parsed.ok && parsed.error}</p>
      )}
    </>
  );
}
function IEEE() {
  const [selected, setSelected] = useState('-19.6875'),
    [width, setWidth] = useState<32 | 64>(32);
  const values: Record<string, number> = {
    '-19.6875': -19.6875,
    '1': 1,
    '-2.5': -2.5,
    '0.2': 0.2,
    '+0': 0,
    '-0': -0,
    '+∞': Infinity,
    '-∞': -Infinity,
    NaN: NaN,
    subnormal: 2 ** -149,
  };
  const result = ieee(
    selected === 'subnormal'
      ? width === 32
        ? 2 ** -149
        : Number.MIN_VALUE
      : values[selected],
    width,
  );
  return (
    <>
      <div className="demo-grid">
        <label>
          Ejemplo
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {Object.keys(values).map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Formato
          <select
            value={width}
            onChange={(e) => setWidth(Number(e.target.value) as 32 | 64)}
          >
            <option value={32}>binary32</option>
            <option value={64}>binary64</option>
          </select>
        </label>
      </div>
      <div className="ieee-fields" style={{ marginTop: 20 }}>
        <div className="ieee-field">
          <span>Signo · 1 bit</span>
          {result.sign}
        </div>
        <div className="ieee-field">
          <span>Exponente · {result.exponent.length} bits</span>
          {result.exponent}
        </div>
        <div className="ieee-field">
          <span>Fracción · {result.fraction.length} bits</span>
          {result.fraction}
        </div>
      </div>
      <div className="demo-output">
        Hex: {result.hex}
        <br />
        Clase: {result.kind}
        <br />
        Valor almacenado:{' '}
        {Object.is(result.stored, -0) ? '−0' : String(result.stored)}
        {result.kind === 'normal' || result.kind === 'subnormal' ? (
          <>
            <br />E = {result.storedExponent}; sesgo = {result.bias}; e ={' '}
            {result.realExponent}
            <br />
            Significando:{' '}
            {result.kind === 'normal'
              ? '1.f (uno implícito)'
              : '0.f (sin uno implícito)'}
          </>
        ) : null}
      </div>
      <p className="format-note">
        Los bytes se muestran del más al menos significativo. La entrada se
        representa primero en binary64 y se redondea al formato elegido. NaN
        admite distintos patrones de fracción válidos.
      </p>
    </>
  );
}
function Text() {
  const [raw, setRaw] = useState('hola');
  return (
    <>
      <label>
        Texto (hasta 16 caracteres)
        <input
          value={raw}
          maxLength={16}
          onChange={(e) => setRaw(e.target.value)}
        />
      </label>
      <div className="demo-output">
        {[...raw].map((c, i) => (
          <div key={i}>
            <span className="label">
              {c} · U+
              {c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}
            </span>
            {[...new TextEncoder().encode(c)]
              .map(
                (v) =>
                  `${v.toString(16).toUpperCase().padStart(2, '0')} (${v.toString(2).padStart(8, '0')})`,
              )
              .join(' ')}
          </div>
        ))}
      </div>
      <p className="format-note">
        Se muestran bytes UTF-8. ASCII coincide con UTF-8 para U+0000 a U+007F.
      </p>
    </>
  );
}
function RGB() {
  const [rgb, setRgb] = useState([18, 52, 86]);
  return (
    <>
      <div className="demo-grid">
        {['Rojo', 'Verde', 'Azul'].map((label, i) => (
          <label key={label}>
            {label}: {rgb[i]}
            <input
              type="range"
              min="0"
              max="255"
              value={rgb[i]}
              onChange={(e) =>
                setRgb(
                  rgb.map((v, j) => (j === i ? Number(e.target.value) : v)),
                )
              }
            />
          </label>
        ))}
      </div>
      <div
        className="swatch"
        style={{ background: rgbHex(rgb[0], rgb[1], rgb[2]) }}
        aria-label={`Color RGB ${rgb.join(', ')}`}
      />
      <div className="demo-output">
        {rgbHex(rgb[0], rgb[1], rgb[2])}
        <br />
        {rgb.map((v) => v.toString(2).padStart(8, '0')).join(' ')}₂
      </div>
    </>
  );
}
function Operation() {
  const [a, setA] = useState('13'),
    [b, setB] = useState('6'),
    [operation, setOperation] = useState<BinaryOperation>('add');
  const pa = parseUnsigned(a, 10),
    pb = parseUnsigned(b, 10);
  const result =
    pa.ok &&
    (operation === 'not' || pb.ok) &&
    pa.value < 256n &&
    (operation === 'not' || (pb.ok && pb.value < 256n))
      ? arithmeticColumns(
          pa.value,
          operation === 'not' ? 0n : pb.ok ? pb.value : 0n,
          8,
          operation,
        )
      : null;
  return (
    <>
      <label>
        Operación
        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value as BinaryOperation)}
        >
          <option value="add">Suma</option>
          <option value="subtract">Resta</option>
          <option value="not">NOT de ocho bits</option>
        </select>
      </label>
      <div className="demo-grid">
        <label>
          Operando A (0–255)
          <input
            value={a}
            onChange={(e) => setA(e.target.value)}
            maxLength={3}
          />
        </label>
        <label>
          Operando B (0–255)
          <input
            value={b}
            onChange={(e) => setB(e.target.value)}
            maxLength={3}
            disabled={operation === 'not'}
          />
        </label>
      </div>
      {result && pa.ok ? (
        <>
          <div className="demo-output" role="status">
            Resultado matemático: {result.full.toString()}
            <br />
            Patrón de ocho bits: {result.bits}
            <br />
            {operation === 'add'
              ? `Acarreo exterior: ${Number(result.carry)}.`
              : operation === 'subtract'
                ? `Préstamo exterior: ${Number(result.borrow)}.`
                : 'Se invierten todos los bits.'}{' '}
            {result.outOfRange &&
              'El resultado matemático está fuera del rango sin signo; el patrón mostrado es modular.'}
          </div>
          <p className="format-note">
            Se recorre de derecha a izquierda: posición cero primero. «Entra» y
            «sale» indican{' '}
            {operation === 'subtract' ? 'el préstamo' : 'el acarreo'} de la
            columna; en NOT son cero.
          </p>
          <div
            className="table-scroll"
            role="region"
            aria-label="Operación binaria por columnas"
            tabIndex={0}
          >
            <table className="calculation-table">
              <caption>Desarrollo columna a columna</caption>
              <thead>
                <tr>
                  {['Posición', 'A', 'B', 'Entra', 'Bit', 'Sale'].map(
                    (label) => (
                      <th scope="col" key={label}>
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {result.columns.map((c) => (
                  <tr key={c.position}>
                    <th scope="row">{c.position}</th>
                    <td>{c.a}</td>
                    <td>{operation === 'not' ? '—' : c.b}</td>
                    <td>{c.incoming}</td>
                    <td>{c.bit}</td>
                    <td>{c.outgoing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="notice error">Usa enteros entre 0 y 255.</p>
      )}
    </>
  );
}
function Grouping() {
  const [raw, setRaw] = useState('11111001011');
  const parsed = parseUnsigned(raw, 2);
  return (
    <>
      <label>
        Patrón binario
        <input
          value={raw}
          maxLength={64}
          onChange={(e) => setRaw(e.target.value)}
        />
      </label>
      {parsed.ok ? (
        <div className="demo-output">
          {[3, 4].map((size) => (
            <div key={size}>
              <span className="label">Grupos de {size}:</span>
              {groupBits(raw, size).join(' | ')} →{' '}
              {parsed.value.toString(size === 3 ? 8 : 16).toUpperCase()}
              {size === 3 ? '₈' : '₁₆'}
            </div>
          ))}
        </div>
      ) : (
        <p className="notice error">{parsed.error}</p>
      )}
    </>
  );
}
export function TopicDemo({ kind }: { kind: NonNullable<TopicMeta['demo']> }) {
  const components = {
    counter: Counter,
    signed: Signed,
    bcd: BCD,
    fraction: Fraction,
    ieee: IEEE,
    text: Text,
    rgb: RGB,
    operation: Operation,
    group: Grouping,
  };
  const Component = components[kind];
  return (
    <section className="panel demo" aria-label="Demostración interactiva">
      <p className="eyebrow">MICROLABORATORIO</p>
      <h2>Ahora, cambia los datos</h2>
      <Component />
    </section>
  );
}
