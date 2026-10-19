import { describe, expect, it } from 'vitest';
import {
  allPaths,
  attemptProblems,
  band,
  choose,
  currentNode,
  emptyHistory,
  ending,
  flagsOf,
  GLOSSARY,
  isFinished,
  mistakes,
  newAttempt,
  readiness,
  replayFrom,
  rubric,
  trySubmit,
  upsert,
  validateHistory,
  validateScenario,
  MAX_ATTEMPTS,
  DIMENSION_NAMES,
  type Attempt,
  type Dimension,
  type Scenario,
} from '../src/engine';
import { SCENARIOS, scenarioById } from '../src/scenarios';

const AT = '2026-10-19T10:00:00.000Z';
const client = scenarioById('client-discovery') as Scenario;
const screening = scenarioById('candidate-screening') as Scenario;

function play(s: Scenario, choiceIds: string[], id = 'a1'): Attempt {
  let a = newAttempt(s, id, AT);
  for (const c of choiceIds) {
    const r = choose(s, a, c, AT);
    if (!r.ok) throw new Error(`${c}: ${r.reason}`);
    a = r.attempt;
  }
  return a;
}

function attemptOf(s: Scenario, path: { nodeId: string; choiceId: string }[]): Attempt {
  return play(
    s,
    path.map((p) => p.choiceId),
  );
}

describe('authored scenarios', () => {
  for (const s of SCENARIOS) {
    it(`${s.id} is structurally valid: reachable, acyclic, no dead ends`, () => {
      expect(validateScenario(s)).toEqual([]);
    });
    it(`${s.id}: every path ends at an ending and every node is on some path`, () => {
      const paths = allPaths(s);
      expect(paths.length).toBeGreaterThan(50);
      const onPath = new Set<string>();
      for (const p of paths) {
        const a = attemptOf(s, p);
        expect(isFinished(s, a)).toBe(true);
        p.forEach((x) => onPath.add(x.nodeId));
        onPath.add((currentNode(s, a) as { id: string }).id);
      }
      expect([...onPath].sort()).toEqual(Object.keys(s.nodes).sort());
    });
    it(`${s.id}: rubric effects are consistent with choice quality`, () => {
      for (const n of Object.values(s.nodes)) {
        if (n.kind !== 'step') continue;
        for (const c of n.choices) {
          const values = Object.values(c.effects) as number[];
          const sum = values.reduce((x, y) => x + y, 0);
          if (c.quality === 'strong')
            expect(
              values.every((v) => v > 0),
              `${n.id}/${c.id}`,
            ).toBe(true);
          if (c.quality === 'harmful')
            expect(
              values.some((v) => v <= -2),
              `${n.id}/${c.id}`,
            ).toBe(true);
          if (c.quality === 'weak') expect(sum < 0, `${n.id}/${c.id}`).toBe(true);
          for (const t of c.terms)
            expect(
              GLOSSARY.some((g) => g.id === t),
              `${n.id}/${c.id}: ${t}`,
            ).toBe(true);
        }
      }
    });
    it(`${s.id}: every explanation names at least one rubric dimension the choice affects`, () => {
      // Regression (acceptance review): three explanations named no dimension at all.
      for (const n of Object.values(s.nodes)) {
        if (n.kind !== 'step') continue;
        for (const c of n.choices) {
          const dims = Object.keys(c.effects) as Dimension[];
          const text = c.explanation.toLowerCase();
          expect(
            dims.some((d) => text.includes(DIMENSION_NAMES[d].toLowerCase())),
            `${n.id}/${c.id}`,
          ).toBe(true);
        }
      }
    });
    it(`${s.id}: the all-strong path is ready and meets the standard wherever assessed`, () => {
      const ids: string[] = [];
      let a = newAttempt(s, 'best', AT);
      for (;;) {
        const n = currentNode(s, a);
        if (!n || n.kind === 'end') break;
        const c = n.choices.find((x) => x.quality === 'strong') as { id: string };
        ids.push(c.id);
        a = (choose(s, a, c.id, AT) as { ok: true; attempt: Attempt }).attempt;
      }
      expect(readiness(s, a).ready).toBe(true);
      expect(trySubmit(s, a)).toEqual({ ok: true });
      for (const r of rubric(s, a)) {
        expect(['Meets the practice standard', 'Strong', 'Not assessed on this path']).toContain(
          r.band,
        );
      }
      expect(mistakes(s, a)).toEqual([]);
    });
  }

  it('the validator catches dead ends, cycles, unreachable nodes and single choices', () => {
    const broken: Scenario = JSON.parse(JSON.stringify(client));
    const prep = broken.nodes.prep;
    if (prep?.kind !== 'step') throw new Error('prep');
    prep.choices = [prep.choices[0] as never];
    (prep.choices[0] as { next: string }).next = 'nowhere';
    const errs = validateScenario(broken);
    expect(errs.join('\n')).toMatch(/at least two choices/);
    expect(errs.join('\n')).toMatch(/does not exist/);
    expect(errs.join('\n')).toMatch(/not reachable/);
    const cyc: Scenario = JSON.parse(JSON.stringify(client));
    const close = cyc.nodes.close;
    if (close?.kind !== 'step') throw new Error('close');
    (close.choices[1] as { next: string }).next = 'opening';
    expect(validateScenario(cyc).join('\n')).toMatch(/cycle/);
  });
});

describe('journey 1: client discovery with a weak answer', () => {
  it('a weak answer leads to a realistic consequence, explained, and a stronger replay', () => {
    const a = play(client, ['research', 'promise-cvs', 'send-now']);
    expect(isFinished(client, a)).toBe(true);
    const e = ending(client, a);
    expect(e?.end.title).toBe('Trust lost before the search began');
    expect(e?.consequences[0]).toMatch(/complains to your agency/);
    const m = mistakes(client, a);
    expect(m.map((x) => x.choice.id)).toEqual(['promise-cvs', 'send-now']);
    expect(m[1]?.better.id).toBe('ask-first');
    expect(readiness(client, a).ready).toBe(false);
    const consent = rubric(client, a).find((r) => r.dimension === 'consent');
    expect(consent?.band).toBe('Needs work');

    // Replay from step 2 with the strong opening.
    const r = replayFrom(client, a, 1, 'a2', AT);
    expect(r.steps).toEqual([{ nodeId: 'prep', choiceId: 'research' }]);
    expect(r.replayOf).toBe('a1');
    expect(currentNode(client, r)?.id).toBe('opening');
    const better = choose(client, r, 'slow-down', AT);
    expect(better.ok && currentNode(client, better.attempt)?.id).toBe('requirements');
    expect(a.steps).toHaveLength(3); // original kept
  });
});

describe('journey 2: screening without consent cannot be ready', () => {
  it('a near-perfect call without consent is blocked by consent alone', () => {
    const a = play(screening, [
      'prepare',
      'explain',
      'probe',
      'honest',
      'respect',
      'assume',
      'flag',
      'next-steps',
    ]);
    const r = readiness(screening, a);
    expect(r.ready).toBe(false);
    expect(r.items.filter((i) => !i.ok).map((i) => i.id)).toEqual(['consent']);
    expect(trySubmit(screening, a)).toEqual({
      ok: false,
      blockers: ['Candidate consented to this specific submission'],
    });
  });
  it('no path without recorded consent is ever ready (exhaustive)', () => {
    let withoutConsent = 0;
    for (const p of allPaths(screening)) {
      const a = attemptOf(screening, p);
      if (!flagsOf(screening, a).has('consentObtained')) {
        withoutConsent += 1;
        expect(readiness(screening, a).ready).toBe(false);
      }
    }
    expect(withoutConsent).toBeGreaterThan(20);
  });
  it('a refusal respected is not consent; pressured consent is not consent', () => {
    const pressured = play(screening, [
      'prepare',
      'explain',
      'probe',
      'honest',
      'respect',
      'ask',
      'pressure',
      'flag',
      'next-steps',
    ]);
    expect(readiness(screening, pressured).items.find((i) => i.id === 'consent')?.ok).toBe(false);
  });
  it('an unfinished attempt is never ready', () => {
    const a = play(screening, ['prepare']);
    expect(readiness(screening, a).ready).toBe(false);
    expect(trySubmit(screening, a)).toMatchObject({
      ok: false,
      blockers: expect.arrayContaining(['The conversation is not finished.']),
    });
  });
});

describe('play rules', () => {
  it('refuses unknown choices and choices after the end', () => {
    const a = newAttempt(client, 'x', AT);
    expect(choose(client, a, 'nope', AT)).toEqual({
      ok: false,
      reason: 'That is not a choice at this step.',
    });
    const done = play(client, ['research', 'promise-cvs', 'send-now']);
    expect(choose(client, done, 'research', AT).ok).toBe(false);
    expect(done.finishedAt).toBe(AT);
  });
  it('bands follow the published thresholds', () => {
    expect([
      band(0, 0),
      band(1, -1),
      band(1, 0),
      band(2, 1),
      band(1, 2),
      band(2, 3),
      band(2, 4),
    ]).toEqual([
      'Not assessed on this path',
      'Needs work',
      'Developing',
      'Developing',
      'Meets the practice standard',
      'Meets the practice standard',
      'Strong',
    ]);
  });
  it('rubric evidence lists every contributing choice', () => {
    const a = play(client, ['research', 'slow-down']);
    const prep = rubric(client, a).find((r) => r.dimension === 'preparation');
    expect(prep?.evidence.map((e) => [e.nodeId, e.value])).toEqual([['prep', 2]]);
  });
});

describe('history', () => {
  it('validates attempts against the scenarios and rejects forged steps', () => {
    const a = play(client, ['research', 'slow-down']);
    const h = upsert(emptyHistory(), a);
    expect(validateHistory(JSON.parse(JSON.stringify(h)), SCENARIOS).ok).toBe(true);
    const forged = {
      ...h,
      attempts: [{ ...a, steps: [{ nodeId: 'close', choiceId: 'summary' }] }],
    };
    expect(validateHistory(forged, SCENARIOS).ok).toBe(false);
    expect(validateHistory({ ...h, extra: 1 }, SCENARIOS).ok).toBe(false);
    expect(
      validateHistory({ ...h, attempts: [{ ...a, scenarioId: 'unknown' }] }, SCENARIOS).ok,
    ).toBe(false);
    expect(validateHistory({ ...h, attempts: [{ ...a, finishedAt: AT }] }, SCENARIOS).ok).toBe(
      false,
    );
    expect(validateHistory({ ...h, current: 'missing' }, SCENARIOS).ok).toBe(false);
    expect(attemptProblems(client, a)).toEqual([]);
  });
  it('caps history and keeps the newest attempt', () => {
    let h = emptyHistory();
    for (let i = 0; i < MAX_ATTEMPTS + 5; i += 1)
      h = upsert(h, play(client, ['research', 'promise-cvs', 'send-now'], `a${i}`));
    expect(h.attempts).toHaveLength(MAX_ATTEMPTS);
    expect(h.attempts[h.attempts.length - 1]?.id).toBe(`a${MAX_ATTEMPTS + 4}`);
  });
});
