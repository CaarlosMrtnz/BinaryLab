import { lazy, Suspense, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
} from 'react-router';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowRightLeft,
  BookOpen,
  ChevronDown,
  FlaskConical,
  Menu,
  Moon,
  BookOpenCheck,
  Text,
  Sun,
  X,
} from 'lucide-react';
import { categories, groups, topics } from '@/content/catalog';
import ConverterPage from '@/features/converter/ConverterPage';
const LearnPage = lazy(() => import('@/features/learn/LearnPage'));
const PracticePage = lazy(() => import('@/features/practice/PracticePage'));

function Navigation({ close }: { close?: () => void }) {
  const location = useLocation();
  return (
    <nav aria-label="Navegación principal" className="navigation">
      <p className="eyebrow nav-caption">TU ESPACIO DE TRABAJO</p>
      <NavLink to="/" end onClick={close} className="nav-main">
        <ArrowRightLeft size={19} />
        Conversor<span className="nav-number">01</span>
      </NavLink>
      <details
        className="nav-section"
        open={location.pathname.startsWith('/aprender') || undefined}
      >
        <summary>
          <BookOpen size={19} />
          <span>Aprender</span>
          <ChevronDown size={15} />
        </summary>
        <Link className="nav-index" to="/aprender" onClick={close}>
          Todos los temas
        </Link>
        {groups.map((group, i) => (
          <details
            key={group}
            className="nav-group"
            open={
              topics.some(
                (t) =>
                  t.group === i && location.pathname.endsWith('/' + t.slug),
              ) || undefined
            }
          >
            <summary>{group}</summary>
            {topics
              .filter((t) => t.group === i)
              .map((topic) => (
                <NavLink
                  key={topic.id}
                  to={'/aprender/' + topic.slug}
                  onClick={close}
                >
                  {topic.title}
                </NavLink>
              ))}
          </details>
        ))}
      </details>
      <details
        className="nav-section"
        open={location.pathname.startsWith('/practicar') || undefined}
      >
        <summary>
          <FlaskConical size={19} />
          <span>Practicar</span>
          <ChevronDown size={15} />
        </summary>
        <Link className="nav-index" to="/practicar" onClick={close}>
          Todas las categorías
        </Link>
        {categories.map((category) => (
          <NavLink
            key={category.id}
            to={'/practicar/' + category.id}
            onClick={close}
          >
            <span className="category-number">{category.id}</span>
            {category.title}
          </NavLink>
        ))}
      </details>
      <div className="nav-note">
        <span className="mini-bits" aria-hidden>
          01
          <br />
          10
        </span>
        <p>
          Una misma secuencia.
          <br />
          Muchas formas de entenderla.
        </p>
      </div>
    </nav>
  );
}
function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    const title = pathname.startsWith('/aprender/')
      ? topics.find((t) => pathname.endsWith('/' + t.slug))?.title
      : pathname.startsWith('/practicar/')
        ? categories.find((c) => pathname.endsWith('/' + c.id))?.title
        : pathname === '/aprender'
          ? 'Aprender'
          : pathname === '/practicar'
            ? 'Practicar'
            : pathname === '/'
              ? 'Conversor de bases'
              : 'Página no encontrada';
    document.title = `${title ?? 'Página no encontrada'} · BinaryLab`;
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
export function NotFound() {
  return (
    <section className="empty-page">
      <p className="eyebrow">404</p>
      <h1>Página no encontrada</h1>
      <p>Esta dirección no corresponde a un tema o categoría.</p>
      <Link className="button primary" to="/">
        Volver al conversor
      </Link>
    </section>
  );
}
function Shell() {
  const [dark, setDark] = useState(false),
    [reading, setReading] = useState(false),
    [menu, setMenu] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1200px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setMenu(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  return (
    <div
      className={`app ${dark ? 'dark' : ''} ${reading ? 'comfortable' : ''}`}
    >
      <a className="skip-link" href="#main">
        Saltar al contenido
      </a>
      <RouteEffects />
      <header className="app-header">
        <div className="brand-area">
          <Dialog.Root open={menu} onOpenChange={setMenu}>
            <Dialog.Trigger asChild>
              <button
                className="icon-button menu-trigger"
                aria-label="Abrir menú"
              >
                <Menu size={22} />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="drawer-overlay" />
              <Dialog.Content
                className={`drawer ${dark ? 'dark' : ''} ${reading ? 'comfortable' : ''}`}
              >
                <div className="drawer-header">
                  <Dialog.Title className="drawer-title">
                    Explora BinaryLab
                  </Dialog.Title>
                  <Dialog.Close
                    className="icon-button"
                    aria-label="Cerrar menú"
                  >
                    <X size={22} />
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">
                  Conversor, temas de aprendizaje y categorías de práctica.
                </Dialog.Description>
                <div className="drawer-body">
                  <Navigation close={() => setMenu(false)} />
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <Link to="/" className="brand" aria-label="BinaryLab, conversor">
            <span>
              Binary<span>Lab</span>
            </span>
          </Link>
          <span className="brand-divider" />
          <span className="header-caption">PIENSA EN BINARIO</span>
        </div>
        <div className="header-controls">
          <button
            className="reading-button"
            role="switch"
            aria-label="Lectura cómoda"
            aria-checked={reading}
            onClick={() => setReading(!reading)}
          >
            {reading ? (
              <BookOpenCheck size={19} aria-hidden />
            ) : (
              <Text size={19} aria-hidden />
            )}
            <span>{reading ? 'Lectura cómoda' : 'Lectura normal'}</span>
            <span className="switch-track" aria-hidden>
              <span />
            </span>
          </button>
          <span className="control-divider" />
          <button
            className="icon-button"
            aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
            onClick={() => setDark(!dark)}
            title={dark ? 'Modo claro' : 'Modo oscuro'}
          >
            {dark ? <Sun size={21} /> : <Moon size={21} />}
          </button>
        </div>
      </header>
      <div className="app-layout">
        <div className="desktop-sidebar">
          <Navigation />
        </div>
        <main id="main" tabIndex={-1}>
          <Suspense
            fallback={
              <p className="loading" role="status">
                Cargando contenido…
              </p>
            }
          >
            <Routes>
              <Route path="/" element={<ConverterPage />} />
              <Route path="/aprender" element={<LearnPage />} />
              <Route path="/aprender/:topic" element={<LearnPage />} />
              <Route path="/practicar" element={<PracticePage />} />
              <Route path="/practicar/:category" element={<PracticePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      <footer className="app-footer">
        <span>
          BinaryLab{' '}
          <span className="muted">/ Laboratorio de representación digital</span>
        </span>
        <span>Sin cuentas. Sin seguimiento. Solo curiosidad.</span>
      </footer>
    </div>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
