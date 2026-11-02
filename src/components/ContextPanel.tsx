import { useState, type ReactNode } from 'react';
import { Lightbulb, ChevronDown } from 'lucide-react';
import { Tabs } from './ui/Tabs';

export function ContextPanel({
  title,
  explanation,
  steps,
  formula,
}: {
  title: string;
  explanation: ReactNode;
  steps: ReactNode;
  formula: ReactNode;
}) {
  const [tab, setTab] = useState('explanation');
  return (
    <aside className="context" aria-label="Ayuda contextual">
      <details open className="context-disclosure">
        <summary>
          <span>
            <Lightbulb size={18} aria-hidden /> Guía del laboratorio
          </span>
          <ChevronDown size={16} aria-hidden />
        </summary>
        <div className="context-inner">
          <p className="eyebrow">PARA ENTENDERLO</p>
          <h2>{title}</h2>
          <Tabs
            value={tab}
            onChange={setTab}
            label="Ayuda contextual"
            items={[
              {
                value: 'explanation',
                label: 'Explicación',
                content: explanation,
              },
              { value: 'steps', label: 'Pasos', content: steps },
              { value: 'formula', label: 'Fórmula', content: formula },
            ]}
          />
        </div>
      </details>
    </aside>
  );
}
