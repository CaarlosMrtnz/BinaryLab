import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { groups, topics } from '@/content/catalog';
import { Markdown } from '@/components/Markdown';
import { ContextPanel } from '@/components/ContextPanel';
import { NotFound } from '@/app/App';
import { TopicDemo } from './TopicDemo';
const articles = import.meta.glob<string>('/src/content/topics/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});
export default function LearnPage() {
  const { topic: slug } = useParams();
  if (!slug)
    return (
      <div className="workspace">
        <section className="work-main">
          <div className="page-heading">
            <p className="eyebrow">
              <BookOpen size={15} /> APRENDER
            </p>
            <h1>
              Detrás de cada bit<span className="title-dot">.</span>
            </h1>
            <p>
              De las primeras potencias de dos a la representación digital.
              Explora a tu ritmo.
            </p>
          </div>
          <div className="index-groups">
            {groups.map((group, i) => (
              <section className="panel index-group" key={group}>
                <h2>
                  <span>0{i + 1}</span>
                  {group}
                </h2>
                <div className="topic-list">
                  {topics
                    .filter((t) => t.group === i)
                    .map((topic) => (
                      <Link key={topic.id} to={'/aprender/' + topic.slug}>
                        <span>{topic.title}</span>
                        <ArrowRight size={16} />
                      </Link>
                    ))}
                </div>
              </section>
            ))}
          </div>
        </section>
        <ContextPanel
          title="Conocer la representación"
          explanation={
            <p>
              Los bits adquieren significado cuando conoces la base, el ancho y
              la codificación. Todos los temas están abiertos desde el
              principio.
            </p>
          }
          steps={
            <ol>
              <li>Lee la definición.</li>
              <li>Sigue el ejemplo resuelto.</li>
              <li>Prueba la demostración o practica.</li>
            </ol>
          }
          formula={
            <>
              <h3>Regla clave</h3>
              <p>Patrón + formato + ancho → interpretación.</p>
            </>
          }
        />
      </div>
    );
  const topic = topics.find((t) => t.slug === slug);
  if (!topic) return <NotFound />;
  const content =
    articles[`/src/content/topics/${String(topic.id).padStart(2, '0')}.md`];
  const examples = [...content.matchAll(/```(?:text)?\n([\s\S]+?)```/g)].map(
    (m) => m[1],
  );
  return (
    <div className="workspace">
      <section className="work-main">
        <Link className="back-link" to="/aprender">
          <ArrowLeft size={14} />
          Todos los temas
        </Link>
        <div className="page-heading">
          <p className="eyebrow">
            {groups[topic.group].toUpperCase()} /{' '}
            {String(topic.id).padStart(2, '0')}
          </p>
          <h1>{topic.title}</h1>
        </div>
        <article className="panel article">
          <Markdown>{content}</Markdown>
          <div className="article-note">
            <h2>Evita este error</h2>
            <p>{topic.error}</p>
          </div>
        </article>
        {topic.demo && <TopicDemo key={topic.slug} kind={topic.demo} />}
        <div className="actions">
          {topic.group <= 1 && (
            <Link className="button" to="/">
              Experimentar en el conversor
            </Link>
          )}
          <Link className="button primary" to={'/practicar/' + topic.category}>
            Practicar este tema
            <ArrowRight size={16} />
          </Link>
          {topics[topic.id] && (
            <Link className="button" to={'/aprender/' + topics[topic.id].slug}>
              Siguiente tema
            </Link>
          )}
        </div>
        <details className="panel article" style={{ marginTop: 24 }}>
          <summary>Glosario de representación digital</summary>
          <Markdown>{articles['/src/content/topics/glossary.md']}</Markdown>
        </details>
      </section>
      <ContextPanel
        key={topic.slug}
        title={topic.title}
        explanation={
          <>
            <h3>Idea clave</h3>
            <p>{topic.rule}</p>
            <p>{topic.error}</p>
          </>
        }
        steps={
          <>
            <h3>Ejemplo de referencia</h3>
            {examples.length ? (
              <pre className="formula">{examples[0]}</pre>
            ) : (
              <p>
                Consulta la tabla y el desarrollo del artículo. Identifica
                primero el formato y el ancho, aplica la regla y comprueba la
                interpretación.
              </p>
            )}
          </>
        }
        formula={
          <>
            <h3>Regla clave</h3>
            <p className="formula">{topic.rule}</p>
            <p>
              Aplica esta regla con el formato y las unidades indicadas en el
              artículo.
            </p>
          </>
        }
      />
    </div>
  );
}
