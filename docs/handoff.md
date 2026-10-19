# Handoff

**State:** v0.1 built locally on branch `phase/07a-build`. Not pushed, not deployed, no remote.
Independent acceptance review (07B) done on 2026-10-19: see Part 1 of `docs/test-report.md`. It fixed
eight defects (with regression tests) and found no remaining blocker for publication review.

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

1. Owner review (README, screenshots, limitations, licence, secret scan) and explicit approval to
   create the repository, push and enable Pages.
2. First CI run on Linux (Chromium) after the push; first Pages deployment loaded and checked under
   `/recruit-sim/`.

## Exact next step

Owner publication review (G3). Nothing else is pending locally; `portfolio-control` registry status
can move to `ready_for_publication_review` (not changed by the acceptance session, which may not edit
that repository).

## Gotchas

- `vite.config.ts` sets `base: '/recruit-sim/'`; e2e runs the production build on port 4179.
- `npm run e2e` rewrites `docs/screenshots`; restore with `git checkout docs/screenshots` unless the
  UI changed.
- Editing a scenario can break the author-rule tests (for example a strong choice with a negative
  effect); that is intended. Choice ids are used by e2e tests (`data-choice`).
