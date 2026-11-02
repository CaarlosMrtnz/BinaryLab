import { useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  BASE_NAMES,
  MAX_DIGITS,
  validDigits,
  type Base,
} from '@/domain/numerals';
const messages: Record<Base, string> = {
  2: 'En binario solo puedes escribir 0 y 1.',
  8: 'En octal solo puedes escribir cifras del 0 al 7.',
  10: 'En decimal solo puedes escribir cifras del 0 al 9.',
  16: 'En hexadecimal solo puedes escribir 0–9 y A–F.',
};

export function NumberInput({
  base,
  raw,
  onChange,
  rangeError,
}: {
  base: Base;
  raw: string;
  onChange: (raw: string) => void;
  rangeError?: string;
}) {
  const [notice, setNotice] = useState(''),
    [composed, setComposed] = useState<string | null>(null);
  const composing = useRef(false);
  function accept(text: string) {
    if (!validDigits(text, base)) {
      setNotice(messages[base]);
      return false;
    }
    if (text.length > MAX_DIGITS && text.length >= raw.length) {
      setNotice(
        `El límite de edición es ${MAX_DIGITS} cifras. La entrada anterior se conserva.`,
      );
      return false;
    }
    onChange(text.toUpperCase());
    setNotice('');
    return true;
  }
  return (
    <div className="number-field">
      <label htmlFor="number-input">
        Número en {BASE_NAMES[base].toLowerCase()}{' '}
        <span className="base-label">BASE {base}</span>
      </label>
      <input
        id="number-input"
        className="number-input"
        type="text"
        autoComplete="off"
        spellCheck={false}
        inputMode={base === 16 ? 'text' : 'numeric'}
        value={composed ?? raw}
        aria-describedby="input-help input-notice"
        aria-invalid={!!rangeError}
        onKeyDown={(e) => {
          if (
            !composing.current &&
            !e.nativeEvent.isComposing &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey &&
            e.key.length === 1 &&
            !validDigits(e.key, base)
          ) {
            e.preventDefault();
            setNotice(messages[base]);
          }
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text');
          const input = e.currentTarget;
          const proposed =
            raw.slice(0, input.selectionStart ?? raw.length) +
            text +
            raw.slice(input.selectionEnd ?? raw.length);
          if (
            !validDigits(proposed, base) ||
            (proposed.length > MAX_DIGITS && proposed.length >= raw.length)
          ) {
            e.preventDefault();
            setNotice(
              !validDigits(proposed, base)
                ? messages[base]
                : `El límite de edición es ${MAX_DIGITS} cifras.`,
            );
          }
        }}
        onCompositionStart={() => {
          composing.current = true;
          setComposed(raw);
        }}
        onCompositionEnd={(e) => {
          composing.current = false;
          accept(e.currentTarget.value);
          setComposed(null);
        }}
        onChange={(e) => {
          if (composing.current) setComposed(e.target.value);
          else accept(e.target.value);
        }}
      />
      <p id="input-help" className="field-help">
        {raw.length > MAX_DIGITS
          ? 'Representación derivada íntegra. Puedes copiarla o acortarla; la entrada manual admite hasta 256 cifras.'
          : raw
            ? 'Edita con el teclado o pega un número. Hasta 256 cifras, sin espacios.'
            : 'Introduce un número para comenzar.'}
      </p>
      <div id="input-notice" role="status" aria-live="polite">
        {(notice || rangeError) && (
          <p className="notice error">
            <AlertCircle size={17} aria-hidden />
            {notice || rangeError}
          </p>
        )}
      </div>
    </div>
  );
}
