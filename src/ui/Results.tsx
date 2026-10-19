/** Shared result widgets: rubric table, readiness checklist, effect chips. */
import {
  DIMENSION_HELP,
  DIMENSION_NAMES,
  readiness,
  rubric,
  type Attempt,
  type Choice,
  type Dimension,
  type Scenario,
} from '../engine';

/** Wraps a choice in quotes unless it is already a quoted line. */
export function quoted(text: string): string {
  return /^[“"]/.test(text) ? text : `“${text}”`;
}

export function EffectChips(props: { choice: Choice }) {
  const entries = Object.entries(props.choice.effects) as [Dimension, number][];
  if (!entries.length) return null;
  return (
    <ul className="chips" aria-label="Rubric evidence from this choice">
      {entries.map(([d, v]) => (
        <li key={d} className={v > 0 ? 'chip up' : 'chip down'}>
          {DIMENSION_NAMES[d]} {v > 0 ? `+${v}` : `−${Math.abs(v)}`}
        </li>
      ))}
    </ul>
  );
}

export function QualityBadge(props: { quality: Choice['quality'] }) {
  const label = {
    strong: 'Strong choice',
    acceptable: 'Acceptable',
    weak: 'Weak choice',
    harmful: 'Harmful choice',
  }[props.quality];
  return <span className={`badge q-${props.quality}`}>{label}</span>;
}

export function RubricTable(props: { s: Scenario; a: Attempt }) {
  const rows = rubric(props.s, props.a);
  return (
    <div className="table-wrap">
      <table className="stack">
        <caption>Rubric evaluation (practice feedback, not a certification)</caption>
        <thead>
          <tr>
            <th scope="col">Dimension</th>
            <th scope="col">Band</th>
            <th scope="col">Evidence from your choices</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.dimension} data-dimension={r.dimension}>
              <th scope="row">
                {DIMENSION_NAMES[r.dimension]}
                <span className="small muted block">{DIMENSION_HELP[r.dimension]}</span>
              </th>
              <td data-label="Band">
                <span className={`badge band-${r.band.split(' ')[0]?.toLowerCase()}`}>
                  {r.band}
                </span>
                {r.evidence.length ? (
                  <span className="small muted block">
                    sum {r.total > 0 ? `+${r.total}` : r.total}
                  </span>
                ) : null}
              </td>
              <td data-label="Evidence">
                {r.evidence.length === 0 ? (
                  <span className="muted small">No choice on this path tested it.</span>
                ) : (
                  <ul className="evidence">
                    {r.evidence.map((e) => (
                      <li key={e.index}>
                        <span className={e.value > 0 ? 'up' : 'down'}>
                          {e.value > 0 ? `+${e.value}` : `−${Math.abs(e.value)}`}
                        </span>{' '}
                        step {e.index + 1}: {quoted(e.choiceText)}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReadinessList(props: { s: Scenario; a: Attempt }) {
  const r = readiness(props.s, props.a);
  return (
    <section className="card" aria-labelledby="ready-h">
      <h3 id="ready-h">
        {r.title}:{' '}
        <span className={r.ready ? 'badge ok' : 'badge bad'} data-testid="readiness">
          {r.ready ? 'Ready' : 'Not ready'}
        </span>
      </h3>
      <p className="small muted">
        Computed only from what you recorded on the call, never from the rubric bands.
      </p>
      <ul className="checklist">
        {r.items.map((i) => (
          <li key={i.id} className={i.ok ? 'pass' : 'fail'} data-item={i.id}>
            <span aria-hidden="true">{i.ok ? '✓' : '✗'}</span>
            <span className="sr-only">{i.ok ? 'Passed:' : 'Not met:'}</span>{' '}
            <strong>{i.label}</strong>
            {!i.ok ? (
              <span className="small block">
                {i.missing.length
                  ? i.missing.some((m) => m !== i.label)
                    ? `Not recorded: ${i.missing.join('; ')}. `
                    : 'Not recorded on this call. '
                  : ''}
                {i.present.length ? `Recorded: ${i.present.join('; ')}. ` : ''}
                {i.why}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
