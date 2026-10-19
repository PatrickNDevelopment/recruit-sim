/** Versioned learning history: strict schema plus a check of every attempt against its scenario. */
import { z } from 'zod';
import { attemptProblems } from './play';
import type { Attempt, Scenario } from './types';

export const HISTORY_SCHEMA = 'recruit-sim.history';
export const HISTORY_VERSION = 1;
export const MAX_ATTEMPTS = 200;

export interface History {
  schema: typeof HISTORY_SCHEMA;
  version: typeof HISTORY_VERSION;
  attempts: Attempt[];
  current: string | null;
}

const id = z.string().regex(/^[a-z0-9-]{1,64}$/);
const attempt = z
  .object({
    id,
    scenarioId: id,
    startedAt: z.string().max(40),
    finishedAt: z.string().max(40).nullable(),
    steps: z.array(z.object({ nodeId: id, choiceId: id }).strict()).max(100),
    coachViews: z.number().int().min(0).max(10_000),
    replayOf: id.nullable(),
  })
  .strict();

const history = z
  .object({
    schema: z.literal(HISTORY_SCHEMA),
    version: z.literal(HISTORY_VERSION),
    attempts: z.array(attempt).max(MAX_ATTEMPTS),
    current: id.nullable(),
  })
  .strict();

export function emptyHistory(): History {
  return { schema: HISTORY_SCHEMA, version: HISTORY_VERSION, attempts: [], current: null };
}

export type HistoryResult = { ok: true; history: History } | { ok: false; errors: string[] };

export function validateHistory(value: unknown, scenarios: readonly Scenario[]): HistoryResult {
  const r = history.safeParse(value);
  if (!r.success)
    return {
      ok: false,
      errors: r.error.issues
        .slice(0, 10)
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
    };
  const h = r.data as History;
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const a of h.attempts) {
    if (ids.has(a.id)) errors.push(`attempt ${a.id}: duplicate id`);
    ids.add(a.id);
    const s = scenarios.find((x) => x.id === a.scenarioId);
    if (!s) {
      errors.push(`attempt ${a.id}: unknown scenario ${a.scenarioId}`);
      continue;
    }
    for (const p of attemptProblems(s, a)) errors.push(`attempt ${a.id}: ${p}`);
  }
  if (h.current !== null && !ids.has(h.current))
    errors.push('current: not an attempt in this history');
  return errors.length ? { ok: false, errors } : { ok: true, history: h };
}

/** Adds or replaces an attempt; the oldest finished attempts are dropped past the cap. */
export function upsert(h: History, a: Attempt): History {
  const others = h.attempts.filter((x) => x.id !== a.id);
  let attempts = [...others, a];
  while (attempts.length > MAX_ATTEMPTS) {
    const i = attempts.findIndex((x) => x.finishedAt !== null && x.id !== a.id);
    attempts = attempts.filter((_, j) => j !== (i < 0 ? 0 : i));
  }
  return { ...h, attempts };
}
