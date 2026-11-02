import { useEffect, useRef, useState, type Ref } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FlaskConical,
  Lightbulb,
  RotateCcw,
} from 'lucide-react';
import { categories } from '@/content/catalog';
import { exercises } from '@/content/exercises/registry';
import {
  evaluateAnswers,
  type Choice,
  type Evaluation,
} from '@/domain/answers';
import { ContextPanel } from '@/components/ContextPanel';
import { Markdown } from '@/components/Markdown';
import { NotFound } from '@/app/App';

type Exercise = (typeof exercises)[number];
function shuffle(choices: Choice[]) {
  const shuffled = [...choices];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
function Runner({
  exercise,
  mode,
  next,
  position,
  headingRef,
}: {
  exercise: Exercise;
  mode: string;
  next: () => void;
  position: number;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const [choices] = useState(() => shuffle(exercise.choices));
  const [values, setValues] = useState<string[]>(exercise.fields.map(() => ''));
  const [selected, setSelected] = useState<string | null>(null),
    [feedback, setFeedback] = useState<Evaluation | null>(null),
    [revealed, setRevealed] = useState(false),
    [hints, setHints] = useState(0);
  const checked =
    feedback?.status === 'correct' || feedback?.status === 'incorrect';
  const unlocked = revealed || checked;
  function submit(answer: string[], option?: string) {
    const result = evaluateAnswers(exercise.fields, answer);
    setFeedback(result);
    if (option !== undefined) setSelected(option);
  }
  const solution = (
    <>
      <h3>Solución y desarrollo</h3>
      <Markdown>{exercise.academicAnswer}</Markdown>
      <p>{exercise.explanation}</p>
      <p className="verification">
        Respuestas evaluables:{' '}
        {exercise.fields.map((f) => `${f.label}: ${f.canonical}`).join(' · ')}
      </p>
    </>
  );
  return (
    <div className="workspace">
      <section className="work-main">
        <Link className="back-link" to="/practicar">
          <ArrowLeft size={14} />
          Todas las categorías
        </Link>
        <div className="page-heading">
          <p className="eyebrow">PRÁCTICA / {exercise.categoryId}</p>
          <h1>{categories.find((c) => c.id === exercise.categoryId)?.title}</h1>
          <p>
            Piensa el procedimiento. Comprueba el resultado. Entiende cada paso.
          </p>
        </div>
        <div className="panel exercise-panel">
          <div className="exercise-top">
            <h2 ref={headingRef} tabIndex={-1}>
              Ejercicio {position + 1} de 4
            </h2>
            <span>ID {exercise.id}</span>
          </div>
          <span className="chip">
            {mode === 'quiz' ? 'Tipo test' : 'Escribir respuesta'}
          </span>
          <div className="exercise-prompt">
            <Markdown>{exercise.prompt}</Markdown>
          </div>
          <p className="format-note">
            {mode === 'quiz'
              ? 'Elige una alternativa que resuelva todas las partes. El resultado y el procedimiento se muestran al seleccionar la respuesta o solicitar la solución.'
              : exercise.convention}
          </p>
          {mode === 'quiz' ? (
            <div className="choices" aria-label="Opciones de respuesta">
              {choices.map((choice, i) => {
                const correct =
                  evaluateAnswers(exercise.fields, choice.values).status ===
                  'correct';
                return (
                  <button
                    className={`choice ${unlocked && correct ? 'correct' : ''} ${selected === choice.id && !correct ? 'incorrect' : ''}`}
                    key={choice.id}
                    aria-pressed={selected === choice.id}
                    disabled={!!checked || revealed}
                    onClick={() => submit(choice.values, choice.id)}
                  >
                    <span className="choice-letter">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>
                      {choice.label}
                      {unlocked && correct && (
                        <span> · Respuesta correcta</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(values);
              }}
              noValidate
            >
              <div className="written-fields">
                {exercise.fields.map((field, i) => (
                  <div key={i} className="written-field">
                    <label htmlFor={`answer-${i}`}>
                      {field.label}
                      <input
                        id={`answer-${i}`}
                        value={values[i]}
                        maxLength={512}
                        autoComplete="off"
                        spellCheck={false}
                        aria-describedby={`format-${i}`}
                        aria-invalid={
                          feedback?.status === 'format' &&
                          evaluateAnswers([field], [values[i]]).status ===
                            'format'
                        }
                        onChange={(e) => {
                          setValues(
                            values.map((v, j) =>
                              j === i ? e.target.value : v,
                            ),
                          );
                          setFeedback(null);
                        }}
                      />
                    </label>
                    <p id={`format-${i}`}>{field.instruction}</p>
                  </div>
                ))}
              </div>
              <div className="actions">
                <button className="button primary" type="submit">
                  <Check size={16} />
                  Comprobar
                </button>
              </div>
            </form>
          )}
          <div aria-live="polite">
            {feedback && (
              <div
                className={`feedback ${feedback.status === 'correct' ? 'success' : feedback.status === 'incorrect' ? 'error' : ''}`}
                role="status"
              >
                <h3>
                  {revealed
                    ? 'Solución consultada'
                    : feedback.status === 'correct'
                      ? 'Correcto'
                      : feedback.status === 'incorrect'
                        ? 'No es correcto'
                        : 'Revisa el formato'}
                </h3>
                <p>{feedback.message}</p>
                {checked && <p>{exercise.explanation}</p>}
              </div>
            )}
          </div>
          {revealed && !checked && (
            <p className="notice">
              Solución consultada antes de responder. Puedes reintentar para
              resolverlo sin ayuda.
            </p>
          )}
          <div className="actions exercise-actions">
            <button
              className="button"
              onClick={() => {
                setValues(exercise.fields.map(() => ''));
                setFeedback(null);
                setSelected(null);
                setRevealed(false);
                setHints(0);
              }}
            >
              <RotateCcw size={15} />
              Reintentar
            </button>
            <button className="button primary" onClick={next}>
              Otro ejercicio
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="actions">
            <Link
              className="inline-link"
              to={'/aprender/' + exercise.topicSlug}
            >
              Repasar este tema
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      <ContextPanel
        key={exercise.id}
        title="Una pista, si la necesitas"
        explanation={
          <>
            <h3>Antes de calcular</h3>
            <p>{exercise.rule}</p>
            <p>Revisa las bases, el formato y los anchos del enunciado.</p>
            <button
              className="button"
              onClick={() => setHints(Math.min(hints + 1, 2))}
              disabled={hints === 2}
            >
              <Lightbulb size={15} />
              {hints === 0
                ? 'Pedir pista'
                : hints === 1
                  ? 'Otra pista'
                  : 'Pistas consultadas'}
            </button>
            {hints > 0 && (
              <ol className="hint-list">
                {exercise.hints.slice(0, hints).map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ol>
            )}
            {hints === 2 && !unlocked && (
              <button className="button" onClick={() => setRevealed(true)}>
                Mostrar desarrollo y solución
              </button>
            )}
          </>
        }
        steps={
          unlocked ? (
            solution
          ) : (
            <>
              <p>
                El desarrollo permanece oculto hasta comprobar tu respuesta o
                solicitarlo.
              </p>
              <button className="button" onClick={() => setRevealed(true)}>
                Mostrar solución
              </button>
            </>
          )
        }
        formula={
          <>
            <h3>Regla general</h3>
            <p className="formula">{exercise.rule}</p>
            <p>
              Primero identifica qué representa cada grupo de cifras. Los
              valores concretos se muestran después de comprobar.
            </p>
          </>
        }
      />
    </div>
  );
}
function Category({ id }: { id: string }) {
  const [position, setPosition] = useState(0),
    [mode, setMode] = useState('quiz'),
    [attempt, setAttempt] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusPending = useRef(false);
  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    const heading = headingRef.current;
    if (!heading) return;
    heading.focus({ preventScroll: true });
    const bounds = heading.getBoundingClientRect();
    if (bounds.top < 0 || bounds.bottom > window.innerHeight)
      heading.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [position, attempt]);
  const selection = exercises.filter((e) => e.categoryId === id),
    exercise = selection[position];
  if (!exercise) return <NotFound />;
  return (
    <>
      <div className="practice-chooser">
        <label>
          Modalidad
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="quiz">Tipo test</option>
            <option value="written">Escribir respuesta</option>
          </select>
        </label>
        <label>
          Ejercicio
          <select
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
          >
            {selection.map((e, i) => (
              <option key={e.id} value={i}>
                {e.id}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Runner
        key={`${exercise.id}-${mode}-${attempt}`}
        exercise={exercise}
        mode={mode}
        position={position}
        headingRef={headingRef}
        next={() => {
          focusPending.current = true;
          setPosition((position + 1) % 4);
          setAttempt(attempt + 1);
        }}
      />
    </>
  );
}
export default function PracticePage() {
  const { category } = useParams();
  if (category) return <Category key={category} id={category} />;
  return (
    <div className="workspace">
      <section className="work-main">
        <div className="page-heading">
          <p className="eyebrow">
            <FlaskConical size={15} /> PRACTICAR
          </p>
          <h1>
            Haz tuyos los números<span className="title-dot">.</span>
          </h1>
          <p>
            21 categorías, 84 ejercicios. Elige un tema y resuelve en tipo test
            o con respuesta escrita.
          </p>
        </div>
        <div className="panel index-group topic-list">
          {categories.map((c) => (
            <Link key={c.id} to={'/practicar/' + c.id}>
              <span>
                {c.id} · {c.title}
              </span>
              <span>
                4 ejercicios{' '}
                <ArrowRight size={13} style={{ display: 'inline' }} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <ContextPanel
        title="Practicar sin presión"
        explanation={
          <p>
            Todos los ejercicios están disponibles. Se corrige cada respuesta
            con su desarrollo; no se guarda ningún resultado.
          </p>
        }
        steps={
          <ol>
            <li>Selecciona la categoría.</li>
            <li>Elige tipo test o respuesta escrita.</li>
            <li>Resuelve, comprueba y repasa el método.</li>
          </ol>
        }
        formula={
          <>
            <h3>Regla clave</h3>
            <p>
              Comprobar el formato es tan importante como comprobar el valor.
            </p>
          </>
        }
      />
    </div>
  );
}
