# Contributing

1. Read [docs/spec](docs/spec) first.
2. `npm ci`, then `npm run verify` before you push. It runs format, lint, strict types, unit tests,
   the production build, the secret scan and the Playwright suite.
3. Scenarios are data in `src/scenarios`. Keep every participant and company fictional. The tests
   enforce the structure (reachable, acyclic, no dead ends, at least two choices, one strong choice,
   declared flags and dimensions) and the author rules: strong choices only positive evidence, harmful
   choices at least one −2, weak choices a negative sum, and the all-strong path ready.
4. Every choice needs a visible consequence and an explanation that names the rubric dimensions it
   affects. Coaching lists missing information before the suggestion.
5. Never add an overall score, percentage or anything that reads as a certification.
6. Add a regression test for every bug you fix.
