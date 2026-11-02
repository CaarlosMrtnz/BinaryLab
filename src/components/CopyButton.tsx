import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('Copiado');
    } catch {
      setStatus('No se pudo copiar. Selecciona y copia el valor manualmente.');
    }
  }
  return (
    <div className="copy-control">
      <button
        className="icon-button"
        onClick={copy}
        aria-label={`Copiar ${label}`}
        disabled={!value}
        title={`Copiar ${label}`}
      >
        {status === 'Copiado' ? <Check size={17} /> : <Copy size={17} />}
      </button>
      <span role="status" className={status ? 'copy-status' : 'sr-only'}>
        {status}
      </span>
    </div>
  );
}
