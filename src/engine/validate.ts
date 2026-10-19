/** Structural validation of authored scenarios (spec 00 "Structural rules"). */
import { DIMENSIONS, type Scenario, type StepNode } from './types';

export function validateScenario(s: Scenario): string[] {
  const errors: string[] = [];
  const ids = Object.keys(s.nodes);
  const flags = new Set(s.flags.map((f) => f.id));
  if (!s.nodes[s.start]) errors.push(`start node "${s.start}" does not exist`);
  for (const [key, node] of Object.entries(s.nodes)) {
    if (node.id !== key) errors.push(`node key "${key}" has id "${node.id}"`);
    if (node.kind === 'end') continue;
    if (!s.phases.includes(node.phase)) errors.push(`${node.id}: unknown phase "${node.phase}"`);
    if (node.choices.length < 2) errors.push(`${node.id}: needs at least two choices`);
    if (!node.choices.some((c) => c.quality === 'strong'))
      errors.push(`${node.id}: needs a strong choice`);
    if (new Set(node.choices.map((c) => c.text)).size !== node.choices.length)
      errors.push(`${node.id}: duplicate choice text`);
    if (new Set(node.choices.map((c) => c.id)).size !== node.choices.length)
      errors.push(`${node.id}: duplicate choice id`);
    if (node.coach.missing.length === 0 || node.coach.hint.trim() === '')
      errors.push(`${node.id}: coaching needs missing information and a hint`);
    for (const c of node.choices) {
      if (!s.nodes[c.next]) errors.push(`${node.id}/${c.id}: next "${c.next}" does not exist`);
      if (c.consequence.trim() === '' || c.explanation.trim() === '')
        errors.push(`${node.id}/${c.id}: consequence and explanation are required`);
      for (const [d, v] of Object.entries(c.effects)) {
        if (!(DIMENSIONS as readonly string[]).includes(d))
          errors.push(`${node.id}/${c.id}: unknown dimension "${d}"`);
        if (!Number.isInteger(v) || (v as number) < -2 || (v as number) > 2 || v === 0)
          errors.push(`${node.id}/${c.id}: effect ${d} must be -2..2 and not 0`);
      }
      for (const f of [...c.set, ...c.clear])
        if (!flags.has(f)) errors.push(`${node.id}/${c.id}: undeclared flag "${f}"`);
    }
  }
  for (const item of s.readiness.items) {
    for (const f of [...item.requires, ...item.forbids])
      if (!flags.has(f)) errors.push(`readiness ${item.id}: undeclared flag "${f}"`);
  }
  for (const fc of s.flagConsequences)
    if (!flags.has(fc.flag)) errors.push(`consequence: undeclared flag "${fc.flag}"`);

  // Reachability and cycles (depth-first search with colouring).
  const state = new Map<string, 'open' | 'done'>();
  const visit = (id: string, trail: string[]) => {
    const node = s.nodes[id];
    if (!node) return;
    if (state.get(id) === 'open') {
      errors.push(`cycle: ${[...trail, id].join(' -> ')}`);
      return;
    }
    if (state.get(id) === 'done') return;
    state.set(id, 'open');
    if (node.kind === 'step') for (const c of node.choices) visit(c.next, [...trail, id]);
    state.set(id, 'done');
  };
  if (s.nodes[s.start]) visit(s.start, []);
  for (const id of ids)
    if (!state.has(id)) errors.push(`node "${id}" is not reachable from the start`);
  return errors;
}

/** Every complete path through a scenario (it is a DAG). Used by tests and the branch map. */
export function allPaths(s: Scenario, limit = 100_000): { nodeId: string; choiceId: string }[][] {
  const out: { nodeId: string; choiceId: string }[][] = [];
  const walk = (id: string, path: { nodeId: string; choiceId: string }[]) => {
    if (out.length >= limit) return;
    const node = s.nodes[id];
    if (!node) return;
    if (node.kind === 'end') {
      out.push(path);
      return;
    }
    for (const c of (node as StepNode).choices)
      walk(c.next, [...path, { nodeId: id, choiceId: c.id }]);
  };
  walk(s.start, []);
  return out;
}
