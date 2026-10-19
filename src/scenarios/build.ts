/** Small helpers so scenario files read like scripts. */
import type { Choice, Coach, Dimension, EndNode, Quality, StepNode } from '../engine/types';

export function choice(
  id: string,
  quality: Quality,
  text: string,
  next: string,
  effects: Partial<Record<Dimension, number>>,
  consequence: string,
  explanation: string,
  opts: { set?: string[]; clear?: string[]; terms?: string[] } = {},
): Choice {
  return {
    id,
    text,
    next,
    quality,
    effects,
    set: opts.set ?? [],
    clear: opts.clear ?? [],
    consequence,
    explanation,
    terms: opts.terms ?? [],
  };
}

export function step(
  id: string,
  phase: string,
  speaker: string,
  context: string,
  line: string,
  coach: Coach,
  choices: Choice[],
): StepNode {
  return { kind: 'step', id, phase, speaker, context, line, coach, choices };
}

export function end(id: string, title: string, text: string): EndNode {
  return { kind: 'end', id, title, text };
}
