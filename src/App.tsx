import { useEffect, useState } from 'react';
import {
  choose,
  newAttempt,
  replayFrom,
  upsert,
  emptyHistory,
  type Attempt,
  type History,
} from './engine';
import { download } from './lib/files';
import { loadHistory, newId, saveHistory } from './lib/storage';
import { scenarioById } from './scenarios';
import { Play } from './ui/Play';
import { About, Glossary, HistoryPage, Home, Review, RubricPage } from './ui/Pages';

type Route =
  | { page: 'home' }
  | { page: 'play'; id: string }
  | { page: 'review'; id: string }
  | { page: 'history' }
  | { page: 'glossary'; term: string | null }
  | { page: 'rubric' }
  | { page: 'about' };

function parseRoute(): Route {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/');
  const [p, arg] = parts;
  if (p === 'play' && arg) return { page: 'play', id: arg };
  if (p === 'review' && arg) return { page: 'review', id: arg };
  if (p === 'history') return { page: 'history' };
  if (p === 'glossary') return { page: 'glossary', term: arg ?? null };
  if (p === 'rubric') return { page: 'rubric' };
  if (p === 'about') return { page: 'about' };
  return { page: 'home' };
}

const NAV: { href: string; label: string; pages: Route['page'][] }[] = [
  { href: '#/', label: 'Scenarios', pages: ['home', 'play'] },
  { href: '#/history', label: 'History', pages: ['history', 'review'] },
  { href: '#/rubric', label: 'Rubric', pages: ['rubric'] },
  { href: '#/glossary', label: 'Glossary', pages: ['glossary'] },
  { href: '#/about', label: 'About', pages: ['about'] },
];

const now = (): string => new Date().toISOString();

function boot(): { history: History; recovered: { raw: string; errors: string[] } | null } {
  const r = loadHistory();
  return r.kind === 'ok'
    ? { history: r.history, recovered: null }
    : { history: emptyHistory(), recovered: { raw: r.raw, errors: r.errors } };
}

export function App() {
  const [start] = useState(boot);
  const [history, setHistory] = useState<History>(start.history);
  const [recovered, setRecovered] = useState(start.recovered);
  const [route, setRoute] = useState<Route>(parseRoute);
  const [message, setMessage] = useState('');
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    const on = () => setRoute(parseRoute());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  useEffect(() => {
    const label = NAV.find((n) => n.pages.includes(route.page))?.label ?? 'RecruitSim';
    document.title = `${label} · RecruitSim`;
  }, [route]);

  function commit(h: History, msg = '') {
    setHistory(h);
    setStorageError(saveHistory(h));
    if (msg) setMessage(msg);
  }

  function open(a: Attempt, msg: string) {
    commit({ ...upsert(history, a), current: a.id }, msg);
    window.location.assign(`#/play/${a.id}`);
  }

  const attemptId = route.page === 'play' || route.page === 'review' ? route.id : null;
  const attempt = attemptId ? history.attempts.find((x) => x.id === attemptId) : undefined;
  const scenario = attempt ? scenarioById(attempt.scenarioId) : undefined;

  function replay(index: number) {
    if (!attempt || !scenario) return;
    open(
      replayFrom(scenario, attempt, index, newId(), now()),
      `Replaying from step ${index + 1}. Your earlier attempt is kept in History.`,
    );
  }

  return (
    <div className="app">
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="top">
        <div className="brand">
          <h1>RecruitSim</h1>
          <p className="small muted">Guided recruiting practice</p>
        </div>
        <nav aria-label="Sections">
          <ul>
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} aria-current={n.pages.includes(route.page) ? 'page' : undefined}>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <div className="sample-banner" role="note" data-testid="sample-banner">
        <strong>Practice only, fictional data.</strong> Every person, company and figure is
        invented. Feedback here is not a certification of recruiting competence or legal compliance,
        and no real candidate is assessed.
      </div>
      {recovered ? (
        <div className="notice danger" role="alert">
          <strong>Your saved history could not be read and was not loaded.</strong> A copy was kept
          in browser storage.
          <ul>
            {recovered.errors.slice(0, 5).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() =>
              download('recruit-sim-recovered.json', recovered.raw, 'application/json')
            }
          >
            Download the unreadable copy
          </button>{' '}
          <button type="button" className="secondary" onClick={() => setRecovered(null)}>
            Dismiss
          </button>
        </div>
      ) : null}
      {storageError ? (
        <div className="notice warn" role="alert">
          {storageError}
        </div>
      ) : null}
      <p className="status" role="status" aria-live="polite">
        {message}
      </p>
      <main id="main" tabIndex={-1}>
        {route.page === 'home' ? (
          <Home
            history={history}
            onStart={(id) => {
              const s = scenarioById(id);
              if (s) open(newAttempt(s, newId(), now()), `Started “${s.title}”.`);
            }}
          />
        ) : null}
        {(route.page === 'play' || route.page === 'review') && (!attempt || !scenario) ? (
          <div className="card empty">
            <p>That attempt is not in this browser’s history.</p>
            <a href="#/">Choose a scenario</a>
          </div>
        ) : null}
        {route.page === 'play' && attempt && scenario ? (
          <Play
            s={scenario}
            a={attempt}
            onChoose={(choiceId) => {
              const r = choose(scenario, attempt, choiceId, now());
              if (!r.ok) return setMessage(r.reason);
              commit(
                { ...upsert(history, r.attempt), current: r.attempt.id },
                r.attempt.finishedAt ? 'Scenario finished. Review the ending below.' : '',
              );
            }}
            onCoach={() =>
              commit(upsert(history, { ...attempt, coachViews: attempt.coachViews + 1 }))
            }
            onReplay={replay}
          />
        ) : null}
        {route.page === 'review' && attempt && scenario ? (
          <Review s={scenario} a={attempt} onReplay={replay} />
        ) : null}
        {route.page === 'history' ? (
          <HistoryPage
            history={history}
            onClear={() => commit(emptyHistory(), 'History cleared.')}
            onDelete={(id) =>
              commit(
                {
                  ...history,
                  attempts: history.attempts.filter((a) => a.id !== id),
                  current: history.current === id ? null : history.current,
                },
                'Attempt deleted.',
              )
            }
          />
        ) : null}
        {route.page === 'glossary' ? <Glossary focus={route.term} /> : null}
        {route.page === 'rubric' ? <RubricPage /> : null}
        {route.page === 'about' ? <About /> : null}
      </main>
      <footer className="foot small muted">
        <p>
          Practice software with fictional scenarios. Not proof of recruiting competence or legal
          compliance. Your history stays in this browser. <a href="#/about">About</a>
        </p>
      </footer>
    </div>
  );
}
