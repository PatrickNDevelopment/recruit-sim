/** Data model (docs/spec/00-scenarios-rubric-readiness.md). */

export const DIMENSIONS = [
  'preparation',
  'ethics',
  'relevance',
  'expectations',
  'consent',
  'escalation',
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_NAMES: Record<Dimension, string> = {
  preparation: 'Factual preparation',
  ethics: 'Ethical conduct',
  relevance: 'Question relevance',
  expectations: 'Expectation-setting',
  consent: 'Candidate consent',
  escalation: 'Appropriate escalation',
};

export const DIMENSION_HELP: Record<Dimension, string> = {
  preparation:
    'You checked facts before relying on them: the brief, the client, the role, the market.',
  ethics: 'You were honest, fair and lawful, and you did not mislead or discriminate.',
  relevance: 'Your questions were about the job and the decision, not filler or personal matters.',
  expectations:
    'Everyone left knowing what happens next, on what terms, and what is still uncertain.',
  consent: "You only shared a candidate's information with their clear, specific permission.",
  escalation:
    'You recognised what was beyond your role (legal, discriminatory, risky) and involved the right people.',
};

export type Quality = 'strong' | 'acceptable' | 'weak' | 'harmful';

export interface Choice {
  id: string;
  text: string;
  next: string;
  quality: Quality;
  effects: Partial<Record<Dimension, number>>;
  set: string[];
  clear: string[];
  consequence: string;
  explanation: string;
  terms: string[];
}

export interface Coach {
  missing: string[];
  known: string[];
  hint: string;
}

export interface StepNode {
  kind: 'step';
  id: string;
  phase: string;
  speaker: string;
  context: string;
  line: string;
  coach: Coach;
  choices: Choice[];
}

export interface EndNode {
  kind: 'end';
  id: string;
  title: string;
  text: string;
}

export type ScenarioNode = StepNode | EndNode;

export interface ReadinessItem {
  id: string;
  label: string;
  requires: string[];
  forbids: string[];
  why: string;
}

export interface Scenario {
  id: string;
  title: string;
  role: string;
  summary: string;
  participants: { name: string; description: string }[];
  phases: string[];
  flags: { id: string; label: string }[];
  readiness: { title: string; items: ReadinessItem[] };
  flagConsequences: { flag: string; text: string }[];
  start: string;
  nodes: Record<string, ScenarioNode>;
}

export interface AttemptStep {
  nodeId: string;
  choiceId: string;
}

export interface Attempt {
  id: string;
  scenarioId: string;
  startedAt: string;
  finishedAt: string | null;
  steps: AttemptStep[];
  coachViews: number;
  replayOf: string | null;
}
