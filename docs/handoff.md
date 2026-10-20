# Handoff

**State:** v0.1, accepted by an independent review (prompt 07B, 2026-10-19) that fixed eight defects with regression tests (see Part 1 / "Independent acceptance" in
[test-report.md](test-report.md)). Published 2026-10-19: https://github.com/PatrickNDevelopment/recruit-sim, branch `main`; demo
https://patrickndevelopment.github.io/recruit-sim/. CI and Pages are green; the final cross-portfolio audit (2026-10-20) found no
P0 or P1 issue. The reviews were separate Claude Code sessions, not human audits.

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
