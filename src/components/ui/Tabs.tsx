import * as Primitive from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';

// Composición reducida del patrón shadcn/ui sobre Radix: teclado y ARIA provienen de la primitiva.
export function Tabs({
  value,
  onChange,
  label,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  items: { value: string; label: string; content: ReactNode }[];
}) {
  return (
    <Primitive.Root value={value} onValueChange={onChange}>
      <Primitive.List className="tabs" aria-label={label}>
        {items.map((item) => (
          <Primitive.Trigger key={item.value} value={item.value}>
            {item.label}
          </Primitive.Trigger>
        ))}
      </Primitive.List>
      {items.map((item) => (
        <Primitive.Content
          key={item.value}
          value={item.value}
          className="tab-panel"
        >
          {item.content}
        </Primitive.Content>
      ))}
    </Primitive.Root>
  );
}
