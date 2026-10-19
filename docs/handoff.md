# Handoff

**State:** v0.1 built locally on branch `phase/07a-build`. Not pushed, not deployed, no remote.
Registry status `in_progress` until an independent acceptance review (prompt 07B) passes.

## Run

```powershell
npm ci
npm run dev          # http://localhost:5178/recruit-sim/
npm run verify       # full gate (or scripts\verify.ps1 / scripts/verify.sh)
npm test             # unit tests, including every path through both scenarios
```

## What works (covered by tests, see docs/test-report.md)

- Two fictional branching scenarios with consequences, explanations, glossary links and coaching.
- Rubric bands per dimension with evidence; no overall score.
- Readiness checklists computed from recorded facts; "Try to submit (practice)" with exact blockers.
- Mistake review, branch replay, saved learning history (export, clear, delete one, resume).
- Keyboard play with focus management; light/dark; mobile layout.

## What is absent

- No hosted demo; CI and Pages workflows have never run (no remote).
- Backlog: scenario-authoring tool, opt-in AI role-play with clear labelling (docs/backlog.md).

## Release blockers before publication

1. Independent acceptance review (07B).
2. Owner review and explicit approval to publish.
3. First CI run on Linux.

## Gotchas

- `vite.config.ts` sets `base: '/recruit-sim/'`; e2e runs the production build on port 4179.
- `npm run e2e` rewrites `docs/screenshots`; restore with `git checkout docs/screenshots` unless the
  UI changed.
- Editing a scenario can break the author-rule tests (for example a strong choice with a negative
  effect); that is intended. Choice ids are used by e2e tests (`data-choice`).
