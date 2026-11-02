import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ children }) => (
          <pre
            tabIndex={0}
            role="region"
            aria-label="Ejemplo resuelto; desplazamiento horizontal si es necesario"
          >
            {children}
          </pre>
        ),
        table: ({ children }) => (
          <div
            className="table-scroll"
            role="region"
            aria-label="Tabla de referencia"
            tabIndex={0}
          >
            <table>{children}</table>
          </div>
        ),
        h3: ({ children }) => <h2>{children}</h2>,
        h4: ({ children }) => <h3>{children}</h3>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
