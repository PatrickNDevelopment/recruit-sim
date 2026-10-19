/** Playing an attempt: the current step, what just happened, coaching, and the ending. */
import { useEffect, useRef, useState } from 'react';
import {
  currentNode,
  ending,
  phaseProgress,
  taken,
  term,
  trySubmit,
  type Attempt,
  type Scenario,
  type StepNode,
} from '../engine';
import { EffectChips, QualityBadge, quoted, ReadinessList, RubricTable } from './Results';

function CoachPanel(props: { node: StepNode; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  const { coach } = props.node;
  return (
    <section className="coach" aria-labelledby={`coach-${props.node.id}`}>
      <button
        type="button"
        className="secondary"
        aria-expanded={open}
        aria-controls={`coach-body-${props.node.id}`}
        id={`coach-${props.node.id}`}
        onClick={() => {
          if (!open) props.onOpen();
          setOpen(!open);
        }}
      >
        {open ? 'Hide coaching' : 'Show coaching for this step'}
      </button>
      {open ? (
        <div id={`coach-body-${props.node.id}`} className="coach-body" data-testid="coach">
          <h4>What is still missing</h4>
          <ul>
            {coach.missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <h4>What you know</h4>
          <ul>
            {coach.known.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <h4>Suggested next action</h4>
          <p>{coach.hint}</p>
          <p className="small muted">
            Coaching is written guidance in the scenario. It uses no AI service and does not change
            your evaluation.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function Terms(props: { ids: string[] }) {
  const terms = props.ids.map(term).filter((t) => t !== undefined);
  if (!terms.length) return null;
  return (
    <p className="small">
      Glossary:{' '}
      {terms.map((t, i) => (
        <span key={t.id}>
          {i ? ', ' : ''}
          <a href={`#/glossary/${t.id}`}>{t.term}</a>
        </span>
      ))}
    </p>
  );
}

export function Play(props: {
  s: Scenario;
  a: Attempt;
  onChoose: (choiceId: string) => void;
  onCoach: () => void;
  onReplay: (index: number) => void;
}) {
  const { s, a } = props;
  const node = currentNode(s, a);
  const steps = taken(s, a);
  const last = steps[steps.length - 1];
  const prog = phaseProgress(s, a);
  const focusRef = useRef<HTMLHeadingElement>(null);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  // Move focus to what changed after each choice, so keyboard and screen-reader users follow along.
  useEffect(() => {
    if (a.steps.length > 0) focusRef.current?.focus();
  }, [a.steps.length]);

  if (!node) return <p className="notice danger">This attempt no longer matches the scenario.</p>;
  const end = ending(s, a);

  return (
    <section aria-labelledby="play-h">
      <h2 id="play-h">{s.title}</h2>
      <p className="small muted">{s.role}</p>
      <ol className="phases" aria-label="Progress">
        {s.phases.map((p, i) => (
          <li
            key={p}
            className={i < prog.index ? 'done' : i === prog.index ? 'now' : ''}
            aria-current={i === prog.index ? 'step' : undefined}
          >
            {p}
          </li>
        ))}
        <li className={end ? 'now' : ''} aria-current={end ? 'step' : undefined}>
          Ending
        </li>
      </ol>

      {last ? (
        <section
          className={`card feedback q-${last.choice.quality}`}
          aria-labelledby="what-happened"
        >
          <h3 id="what-happened" ref={focusRef} tabIndex={-1}>
            What happened (step {steps.length})
          </h3>
          <p>
            You chose: <strong>{quoted(last.choice.text)}</strong>{' '}
            <QualityBadge quality={last.choice.quality} />
          </p>
          <p data-testid="consequence">{last.choice.consequence}</p>
          <p className="explanation">
            <strong>Why:</strong> {last.choice.explanation}
          </p>
          <EffectChips choice={last.choice} />
          <Terms ids={last.choice.terms} />
        </section>
      ) : null}

      {node.kind === 'step' ? (
        <section className="card step" aria-labelledby="step-h" data-node={node.id}>
          <h3 id="step-h" tabIndex={-1} ref={last ? undefined : focusRef}>
            Step {steps.length + 1}: {node.phase}
          </h3>
          <p>{node.context}</p>
          {node.line ? (
            <blockquote className="line">
              <span className="speaker">{node.speaker}</span>
              {node.line}
            </blockquote>
          ) : null}
          <CoachPanel key={node.id} node={node} onOpen={props.onCoach} />
          <fieldset className="choices">
            <legend>What do you do?</legend>
            <ul>
              {node.choices.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="choice"
                    onClick={() => props.onChoose(c.id)}
                    data-choice={c.id}
                  >
                    {c.text}
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>
        </section>
      ) : null}

      {end ? (
        <section className="card ending" aria-labelledby="end-h">
          <h3 id="end-h" data-testid="ending">
            Ending: {end.end.title}
          </h3>
          <p>{end.end.text}</p>
          {end.consequences.length ? (
            <>
              <h4>What follows from what you did</h4>
              <ul data-testid="consequences">
                {end.consequences.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </>
          ) : null}
          <ReadinessList s={s} a={a} />
          <div className="inline-group">
            <button
              type="button"
              onClick={() => {
                const r = trySubmit(s, a);
                setSubmitResult(
                  r.ok
                    ? `Practice check passed: everything ${s.readiness.title.toLowerCase()} needs was recorded. (Nothing is sent anywhere.)`
                    : `Blocked. ${s.readiness.title} is not met: ${r.blockers.join('; ')}.`,
                );
              }}
            >
              {s.id === 'candidate-screening'
                ? 'Try to submit the candidate (practice)'
                : 'Try to start the search (practice)'}
            </button>
            <a className="button secondary" href={`#/review/${a.id}`}>
              Review explanations and mistakes
            </a>
          </div>
          {submitResult ? (
            <p
              className={submitResult.startsWith('Blocked') ? 'notice danger' : 'notice ok'}
              role="alert"
              data-testid="submit-result"
            >
              {submitResult}
            </p>
          ) : null}
          <RubricTable s={s} a={a} />
          <h4>Replay a different branch</h4>
          <ul className="replay-list">
            {steps.map((t) => (
              <li key={t.index}>
                <button
                  type="button"
                  className="secondary small"
                  onClick={() => props.onReplay(t.index)}
                >
                  Replay from step {t.index + 1} ({t.node.phase})
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
