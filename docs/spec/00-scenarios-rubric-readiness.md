# Spec 00: scenarios, rubric, readiness and history

RecruitSim is practice software. Every person and organisation in it is fictional. Its feedback is
practice feedback, not proof of recruiting competence or legal compliance, and it makes no decision
about any real candidate.

## Scenario model

A scenario is data: `{ id, title, role, summary, participants, phases, flags, readiness,
flagConsequences, start, nodes }`.

- **Step node**: `{ id, phase, speaker, context, line, coach, choices }`. `context` is the situation,
  `line` what the other person says. At least **two** choices.
- **End node**: `{ id, kind: "end", title, text }`. No choices.
- **Choice**: `{ id, text, next, quality, effects, set, clear, consequence, explanation, terms }`.
  - `quality`: `strong`, `acceptable`, `weak` or `harmful`.
  - `effects`: rubric evidence, `{ dimension: -2..+2 }` (non-zero values only).
  - `set` / `clear`: flags (declared by the scenario) that the choice records.
  - `consequence`: what visibly happens next (shown at once).
  - `explanation`: why, tied to the named rubric dimensions (shown at once and in review).
- **Coach** (per step): `{ missing, known, hint }`. The UI always shows what is **missing** before the
  suggested next action, and the coach never depends on a paid service.

Structural rules, checked by `validateScenario` in tests and at start-up:

1. Every `next` names an existing node; ids are unique; `start` exists.
2. Every node is reachable from `start`; there are no cycles; every path ends at an end node (no
   dead ends).
3. Every step has at least two choices with distinct texts, and at least one `strong` choice.
4. Every flag used in `set`, `clear`, readiness checks or consequences is declared.
5. Effects use only the six rubric dimensions, with values −2..+2.

## Rubric

Six dimensions: **factual preparation**, **ethical conduct**, **question relevance**,
**expectation-setting**, **candidate consent**, **appropriate escalation**.

For one attempt, each dimension's evidence is the list of choices that touched it and the sum of
their values. The band:

| Sum                 | Band                        |
| ------------------- | --------------------------- |
| no evidence on path | Not assessed on this path   |
| below 0             | Needs work                  |
| 0 or 1              | Developing                  |
| 2 or 3              | Meets the practice standard |
| 4 or more           | Strong                      |

There is no overall percentage or grade. Every band is shown with the choices that produced it.

## Readiness

Each scenario defines one readiness check (client discovery: "Search kick-off readiness"; candidate
screening: "Submission readiness"), made of items `{ label, requires, forbids, why }` over flags. The
check passes only when every item passes. Readiness is computed from what was recorded, not from the
rubric, so a high rubric band can never override a missing consent. "Try to submit (practice)" shows
the blocking items and never marks a blocked attempt as submitted.

`flagConsequences` describe realistic consequences that follow from recorded flags (for example an
invoice dispute after unclear fee terms); they are shown on the ending screen.

## Attempts, review and replay

- An attempt is `{ id, scenarioId, startedAt, finishedAt, steps: [{ nodeId, choiceId }], coachViews,
replayOf }`. Its result (flags, bands, readiness, ending) is always recomputed from the steps, so
  stored results cannot be forged or go stale.
- **Mistake review** lists the weak and harmful choices of an attempt with the consequence, the
  explanation and the strong alternative at that step.
- **Branch replay** starts a new attempt that copies the steps before a chosen step and continues from
  there. The original attempt is kept.
- **History** keeps up to 200 attempts in `localStorage` (`recruit-sim.history.v1`, strict schema,
  unknown scenario or node ids rejected); an unreadable store is kept aside and offered as a download.
  History can be exported as JSON and cleared after confirmation.
