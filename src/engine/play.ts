/** Playing, evaluating, reviewing and replaying attempts. Results are always recomputed from steps. */
import {
  DIMENSIONS,
  type Attempt,
  type Choice,
  type Dimension,
  type EndNode,
  type ReadinessItem,
  type Scenario,
  type ScenarioNode,
  type StepNode,
} from './types';

export function newAttempt(
  s: Scenario,
  id: string,
  at: string,
  replayOf: string | null = null,
): Attempt {
  return {
    id,
    scenarioId: s.id,
    startedAt: at,
    finishedAt: null,
    steps: [],
    coachViews: 0,
    replayOf,
  };
}

export function currentNode(s: Scenario, a: Attempt): ScenarioNode | null {
  const last = a.steps[a.steps.length - 1];
  if (!last) return s.nodes[s.start] ?? null;
  const step = s.nodes[last.nodeId];
  if (!step || step.kind !== 'step') return null;
  const c = step.choices.find((x) => x.id === last.choiceId);
  return c ? (s.nodes[c.next] ?? null) : null;
}

export function isFinished(s: Scenario, a: Attempt): boolean {
  return currentNode(s, a)?.kind === 'end';
}

export type ChooseResult = { ok: true; attempt: Attempt } | { ok: false; reason: string };

export function choose(s: Scenario, a: Attempt, choiceId: string, at: string): ChooseResult {
  const node = currentNode(s, a);
  if (!node) return { ok: false, reason: 'This attempt does not match the scenario.' };
  if (node.kind === 'end') return { ok: false, reason: 'This attempt is already finished.' };
  const c = node.choices.find((x) => x.id === choiceId);
  if (!c) return { ok: false, reason: 'That is not a choice at this step.' };
  const steps = [...a.steps, { nodeId: node.id, choiceId }];
  const next = s.nodes[c.next];
  return { ok: true, attempt: { ...a, steps, finishedAt: next?.kind === 'end' ? at : null } };
}

/** A new attempt with the steps before `index`, continuing at that step. The original is untouched. */
export function replayFrom(
  s: Scenario,
  a: Attempt,
  index: number,
  id: string,
  at: string,
): Attempt {
  const keep = a.steps.slice(0, Math.max(0, Math.min(index, a.steps.length)));
  return { ...newAttempt(s, id, at, a.id), steps: keep };
}

/** Checks a stored attempt against the scenario: every step must be the node reached so far. */
export function attemptProblems(s: Scenario, a: Attempt): string[] {
  if (a.scenarioId !== s.id) return ['wrong scenario'];
  let nodeId = s.start;
  for (const [i, st] of a.steps.entries()) {
    const node = s.nodes[nodeId];
    if (!node || node.kind !== 'step' || st.nodeId !== nodeId)
      return [`step ${i + 1} is not the node reached at that point`];
    const c = node.choices.find((x) => x.id === st.choiceId);
    if (!c) return [`step ${i + 1} names an unknown choice`];
    nodeId = c.next;
  }
  const end = s.nodes[nodeId]?.kind === 'end';
  if (a.finishedAt !== null && !end) return ['marked finished but not at an ending'];
  if (a.finishedAt === null && end) return ['at an ending but not marked finished'];
  return [];
}

export interface Taken {
  index: number;
  node: StepNode;
  choice: Choice;
}

export function taken(s: Scenario, a: Attempt): Taken[] {
  return a.steps.flatMap((st, index) => {
    const node = s.nodes[st.nodeId];
    if (!node || node.kind !== 'step') return [];
    const choice = node.choices.find((c) => c.id === st.choiceId);
    return choice ? [{ index, node, choice }] : [];
  });
}

export function flagsOf(s: Scenario, a: Attempt): Set<string> {
  const f = new Set<string>();
  for (const t of taken(s, a)) {
    for (const x of t.choice.clear) f.delete(x);
    for (const x of t.choice.set) f.add(x);
  }
  return f;
}

export type Band =
  | 'Not assessed on this path'
  | 'Needs work'
  | 'Developing'
  | 'Meets the practice standard'
  | 'Strong';

export function band(evidence: number, total: number): Band {
  if (evidence === 0) return 'Not assessed on this path';
  if (total < 0) return 'Needs work';
  if (total <= 1) return 'Developing';
  if (total <= 3) return 'Meets the practice standard';
  return 'Strong';
}

export interface DimensionResult {
  dimension: Dimension;
  total: number;
  band: Band;
  evidence: { index: number; nodeId: string; choiceText: string; value: number }[];
}

export function rubric(s: Scenario, a: Attempt): DimensionResult[] {
  const t = taken(s, a);
  return DIMENSIONS.map((d) => {
    const evidence = t
      .filter((x) => x.choice.effects[d] !== undefined)
      .map((x) => ({
        index: x.index,
        nodeId: x.node.id,
        choiceText: x.choice.text,
        value: x.choice.effects[d] as number,
      }));
    const total = evidence.reduce((sum, e) => sum + e.value, 0);
    return { dimension: d, total, band: band(evidence.length, total), evidence };
  });
}

export interface ReadinessResult {
  title: string;
  ready: boolean;
  items: (ReadinessItem & { ok: boolean; missing: string[]; present: string[] })[];
}

export function readiness(s: Scenario, a: Attempt): ReadinessResult {
  const f = flagsOf(s, a);
  const label = (id: string) => s.flags.find((x) => x.id === id)?.label ?? id;
  const items = s.readiness.items.map((it) => {
    const missing = it.requires.filter((x) => !f.has(x)).map(label);
    const present = it.forbids.filter((x) => f.has(x)).map(label);
    return { ...it, ok: missing.length === 0 && present.length === 0, missing, present };
  });
  // An unfinished attempt is never ready.
  return { title: s.readiness.title, ready: isFinished(s, a) && items.every((i) => i.ok), items };
}

export function trySubmit(
  s: Scenario,
  a: Attempt,
): { ok: true } | { ok: false; blockers: string[] } {
  const r = readiness(s, a);
  if (r.ready) return { ok: true };
  const blockers = r.items.filter((i) => !i.ok).map((i) => i.label);
  if (!isFinished(s, a)) blockers.unshift('The conversation is not finished.');
  return { ok: false, blockers };
}

export function ending(s: Scenario, a: Attempt): { end: EndNode; consequences: string[] } | null {
  const node = currentNode(s, a);
  if (!node || node.kind !== 'end') return null;
  const f = flagsOf(s, a);
  return {
    end: node,
    consequences: s.flagConsequences.filter((c) => f.has(c.flag)).map((c) => c.text),
  };
}

export interface Mistake extends Taken {
  better: Choice;
}

export function mistakes(s: Scenario, a: Attempt): Mistake[] {
  return taken(s, a)
    .filter((t) => t.choice.quality === 'weak' || t.choice.quality === 'harmful')
    .map((t) => ({ ...t, better: t.node.choices.find((c) => c.quality === 'strong') as Choice }));
}

export function phaseProgress(
  s: Scenario,
  a: Attempt,
): { phase: string; index: number; of: number } {
  const node = currentNode(s, a);
  if (!node || node.kind === 'end')
    return { phase: 'Ending', index: s.phases.length, of: s.phases.length };
  return { phase: node.phase, index: s.phases.indexOf(node.phase), of: s.phases.length };
}
