/** Home, review, history, glossary, rubric and about pages. */
import { useEffect, useRef, useState } from 'react';
import {
  DIMENSIONS,
  DIMENSION_HELP,
  DIMENSION_NAMES,
  ending,
  GLOSSARY,
  isFinished,
  mistakes,
  readiness,
  taken,
  type Attempt,
  type History,
  type Scenario,
} from '../engine';
import { download } from '../lib/files';
import { SCENARIOS, scenarioById } from '../scenarios';
import { EffectChips, QualityBadge, quoted, ReadinessList, RubricTable } from './Results';

export function Home(props: { history: History; onStart: (scenarioId: string) => void }) {
  return (
    <section aria-labelledby="home-h">
      <h2 id="home-h">Practice scenarios</h2>
      <p>
        Two branching conversations. Each step has several answers with visible consequences and
        explanations tied to a <a href="#/rubric">transparent rubric</a>. Every person and company
        is fictional.
      </p>
      <div className="cards">
        {SCENARIOS.map((s) => {
          const open = props.history.attempts.filter(
            (a) => a.scenarioId === s.id && a.finishedAt === null,
          );
          const resume = open[open.length - 1];
          const done = props.history.attempts.filter(
            (a) => a.scenarioId === s.id && a.finishedAt !== null,
          ).length;
          return (
            <article key={s.id} className="card scenario" data-scenario={s.id}>
              <h3>{s.title}</h3>
              <p className="small muted">{s.role}</p>
              <p>{s.summary}</p>
              <p className="small">
                Participants (fictional): {s.participants.map((p) => p.name).join(', ')} ·{' '}
                {s.phases.length} phases · {done} finished attempt
                {done === 1 ? '' : 's'}
              </p>
              <div className="inline-group">
                <button type="button" onClick={() => props.onStart(s.id)}>
                  Start a new attempt
                </button>
                {resume ? (
                  <a className="button secondary" href={`#/play/${resume.id}`}>
                    Resume (step {resume.steps.length + 1})
                  </a>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function Review(props: { s: Scenario; a: Attempt; onReplay: (index: number) => void }) {
  const { s, a } = props;
  const t = taken(s, a);
  const ms = mistakes(s, a);
  const end = ending(s, a);
  return (
    <section aria-labelledby="review-h">
      <h2 id="review-h">Review: {s.title}</h2>
      <p className="small muted">
        Attempt started {a.startedAt.slice(0, 16).replace('T', ' ')} UTC ·{' '}
        {isFinished(s, a) ? `ended: ${end?.end.title}` : 'in progress'} · coaching opened{' '}
        {a.coachViews} time{a.coachViews === 1 ? '' : 's'}
        {a.replayOf ? ' · replay of an earlier attempt' : ''}
      </p>
      {!isFinished(s, a) ? (
        <p>
          <a href={`#/play/${a.id}`}>Continue this attempt</a>
        </p>
      ) : null}
      <h3>Mistakes ({ms.length})</h3>
      {ms.length === 0 ? <p className="ok-text">No weak or harmful choices on this path.</p> : null}
      <ol className="mistakes">
        {ms.map((m) => (
          <li key={m.index} className="card" data-mistake={m.node.id}>
            <h4>
              Step {m.index + 1} ({m.node.phase}) <QualityBadge quality={m.choice.quality} />
            </h4>
            <p>
              You chose: <strong>{quoted(m.choice.text)}</strong>
            </p>
            <p>What happened: {m.choice.consequence}</p>
            <p>
              <strong>Why it was a problem:</strong> {m.choice.explanation}
            </p>
            <p>
              <strong>A stronger option:</strong> {quoted(m.better.text)}{' '}
              <span className="small muted">({m.better.explanation})</span>
            </p>
            <button
              type="button"
              className="secondary small"
              onClick={() => props.onReplay(m.index)}
            >
              Replay from step {m.index + 1}
            </button>
          </li>
        ))}
      </ol>
      <h3>Every step</h3>
      <ol className="transcript">
        {t.map((x) => (
          <li key={x.index} className="card">
            <h4>
              Step {x.index + 1}: {x.node.phase} <QualityBadge quality={x.choice.quality} />
            </h4>
            <p className="small muted">{x.node.context}</p>
            {x.node.line ? <blockquote className="line">{x.node.line}</blockquote> : null}
            <p>You: {quoted(x.choice.text)}</p>
            <p>{x.choice.consequence}</p>
            <p className="explanation">{x.choice.explanation}</p>
            <EffectChips choice={x.choice} />
            <details>
              <summary>Other options at this step</summary>
              <ul>
                {x.node.choices
                  .filter((c) => c.id !== x.choice.id)
                  .map((c) => (
                    <li key={c.id}>
                      <QualityBadge quality={c.quality} /> {quoted(c.text)}: {c.explanation}
                    </li>
                  ))}
              </ul>
            </details>
            <button
              type="button"
              className="secondary small"
              onClick={() => props.onReplay(x.index)}
            >
              Replay from step {x.index + 1}
            </button>
          </li>
        ))}
      </ol>
      {isFinished(s, a) ? <ReadinessList s={s} a={a} /> : null}
      <RubricTable s={s} a={a} />
    </section>
  );
}

export function HistoryPage(props: {
  history: History;
  onClear: () => void;
  onDelete: (id: string) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const list = [...props.history.attempts].reverse();
  // The pressed button disappears with its row (or the confirmation); keep focus on the page.
  const refocus = () => headingRef.current?.focus();
  return (
    <section aria-labelledby="history-h">
      <div className="row-between">
        <h2 id="history-h" ref={headingRef} tabIndex={-1}>
          Learning history
        </h2>
        <div className="inline-group">
          <button
            type="button"
            className="secondary"
            disabled={list.length === 0}
            onClick={() =>
              download(
                'recruit-sim-history.json',
                `${JSON.stringify(props.history, null, 2)}\n`,
                'application/json',
              )
            }
          >
            Export history JSON
          </button>
          {confirm ? (
            <>
              <button
                type="button"
                className="danger"
                onClick={() => {
                  setConfirm(false);
                  props.onClear();
                  refocus();
                }}
              >
                Yes, delete all
              </button>
              <button type="button" className="secondary" onClick={() => setConfirm(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="secondary"
              disabled={list.length === 0}
              onClick={() => setConfirm(true)}
            >
              Clear history
            </button>
          )}
        </div>
      </div>
      <p className="small muted">Stored only in this browser. Up to 200 attempts are kept.</p>
      {list.length === 0 ? (
        <div className="card empty">
          <p>No attempts yet.</p>
          <a href="#/">Choose a scenario</a>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="stack">
            <thead>
              <tr>
                <th scope="col">Scenario</th>
                <th scope="col">Started (UTC)</th>
                <th scope="col">Status</th>
                <th scope="col">Readiness</th>
                <th scope="col">Mistakes</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => {
                const s = scenarioById(a.scenarioId) as Scenario;
                const done = isFinished(s, a);
                return (
                  <tr key={a.id} data-attempt={a.id}>
                    <th scope="row">
                      {s.title}
                      {a.replayOf ? <span className="small muted block">replay</span> : null}
                    </th>
                    <td data-label="Started (UTC)">{a.startedAt.slice(0, 16).replace('T', ' ')}</td>
                    <td data-label="Status">
                      {done
                        ? `Ended: ${ending(s, a)?.end.title}`
                        : `In progress (step ${a.steps.length + 1})`}
                    </td>
                    <td data-label="Readiness">
                      {done ? (readiness(s, a).ready ? 'Ready' : 'Not ready') : '—'}
                    </td>
                    <td className="num" data-label="Mistakes">
                      {mistakes(s, a).length}
                    </td>
                    <td className="actions">
                      <a
                        className="button secondary small"
                        href={done ? `#/review/${a.id}` : `#/play/${a.id}`}
                      >
                        {done ? 'Review' : 'Resume'}
                      </a>
                      <button
                        type="button"
                        className="secondary small"
                        onClick={() => {
                          props.onDelete(a.id);
                          refocus();
                        }}
                        aria-label={`Delete attempt started ${a.startedAt}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function Glossary(props: { focus: string | null }) {
  const unknown = props.focus !== null && !GLOSSARY.some((t) => t.id === props.focus);
  useEffect(() => {
    if (props.focus) document.getElementById(`term-${props.focus}`)?.focus();
  }, [props.focus]);
  return (
    <section aria-labelledby="glossary-h" className="prose">
      <h2 id="glossary-h">Glossary</h2>
      <p className="small muted">
        Plain-language practice definitions. Laws differ by jurisdiction; nothing here is legal
        advice.
      </p>
      {unknown ? (
        <p className="notice warn" data-testid="unknown-term">
          There is no glossary entry called “{props.focus}”. All entries are listed below.
        </p>
      ) : null}
      <dl className="glossary">
        {GLOSSARY.map((t) => (
          <div key={t.id} className={props.focus === t.id ? 'focused' : undefined}>
            <dt id={`term-${t.id}`} tabIndex={-1}>
              {t.term}
            </dt>
            <dd>{t.definition}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function RubricPage() {
  return (
    <section aria-labelledby="rubric-h" className="prose">
      <h2 id="rubric-h">How you are evaluated</h2>
      <p>
        Every choice is tagged with evidence for zero or more of six dimensions, from −2 to +2. For
        one attempt, each dimension shows the choices that touched it and a band. There is no
        overall score or percentage: this is practice feedback, not a certification of recruiting
        competence or legal compliance.
      </p>
      <h3>Dimensions</h3>
      <dl>
        {DIMENSIONS.map((d) => (
          <div key={d}>
            <dt>{DIMENSION_NAMES[d]}</dt>
            <dd>{DIMENSION_HELP[d]}</dd>
          </div>
        ))}
      </dl>
      <h3>Bands</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Sum of evidence on your path</th>
              <th scope="col">Band</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>No choice on the path tested it</td>
              <td>Not assessed on this path</td>
            </tr>
            <tr>
              <td>Below 0</td>
              <td>Needs work</td>
            </tr>
            <tr>
              <td>0 or 1</td>
              <td>Developing</td>
            </tr>
            <tr>
              <td>2 or 3</td>
              <td>Meets the practice standard</td>
            </tr>
            <tr>
              <td>4 or more</td>
              <td>Strong</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3>Readiness</h3>
      <p>
        Each scenario ends with a readiness checklist (search kick-off, or candidate submission). It
        is computed only from what you recorded: for example, a screening call without the
        candidate’s specific consent is never ready, however good the rest of the call was.
      </p>
    </section>
  );
}

export function About() {
  return (
    <section aria-labelledby="about-h" className="prose">
      <h2 id="about-h">About RecruitSim</h2>
      <p>
        RecruitSim is practice software for new recruiters. It is not proof of recruiting competence
        or legal compliance, and it makes no decision about any real person. All participants,
        companies, products and figures are fictional.
      </p>
      <p>
        It runs entirely in your browser. Your learning history is stored in this browser only
        (localStorage) and can be exported or cleared. There are no accounts, no AI services and no
        network calls.
      </p>
      <p>
        Employment and data-protection rules differ by country. The scenarios teach habits, not the
        law of any particular place.
      </p>
    </section>
  );
}
