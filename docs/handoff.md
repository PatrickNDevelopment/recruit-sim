# Handoff

**State:** v0.1 built locally on branch `phase/07a-build`. Published 2026-10-19: https://github.com/PatrickNDevelopment/recruit-sim (branch `main`), demo https://patrickndevelopment.github.io/recruit-sim/; CI and Pages green on the first run.
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

- Hosted demo: https://patrickndevelopment.github.io/recruit-sim/ (static build). CI and Pages ran green on the first push (2026-10-19).
- Backlog: scenario-authoring tool, opt-in AI role-play with clear labelling (docs/backlog.md).

## Publication

Published 2026-10-19 with the owner's approval (portfolio decision D-007): public repository
https://github.com/PatrickNDevelopment/recruit-sim (MIT, branch `main`), GitHub Pages at https://patrickndevelopment.github.io/recruit-sim/. The
first CI run (Linux, Chromium) and Pages deployment were green; a live check loaded the demo,
refreshed it and found no console errors and no requests to localhost.

## Next action

None required for v0.1; ideas are in `docs/backlog.md`. The portfolio's final cross-project audit
(prompt 13) is next.

## Gotchas

- `vite.config.ts` sets `base: '/recruit-sim/'`; e2e runs the production build on port 4179.
- `npm run e2e` rewrites `docs/screenshots`; restore with `git checkout docs/screenshots` unless the
  UI changed.
- Editing a scenario can break the author-rule tests (for example a strong choice with a negative
  effect); that is intended. Choice ids are used by e2e tests (`data-choice`).
