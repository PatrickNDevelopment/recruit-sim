# Test report

## Builder's report (2026-10-19)

Windows 10, Node 24, Playwright 1.64 with the installed Microsoft Edge (`msedge` channel). CI is
configured for Chromium on Ubuntu but has never run (no remote).

### Full gate

`powershell -File scriptserify.ps1`, exit code **0** (`ALL CHECKS PASSED`):

| Step             | Command                | Result                                                  |
| ---------------- | ---------------------- | ------------------------------------------------------- |
| install          | `npm ci`               | ok, 0 vulnerabilities                                   |
| format           | `npm run format:check` | ok                                                      |
| lint             | `npm run lint`         | ok                                                      |
| types            | `npm run typecheck`    | ok                                                      |
| unit tests       | `npm test`             | 19 passed                                               |
| production build | `npm run build`        | ok, 370 kB JS (113 kB gzip)                             |
| secret scan      | `npm run secrets`      | no findings                                             |
| e2e              | `npm run e2e`          | 9 passed, production build under `/recruit-sim/` (4179) |

### What the unit tests cover

- Both scenarios are structurally valid (reachable, acyclic, no dead ends, at least two choices and one
  strong choice per step, declared flags, phases and dimensions); the validator itself catches a
  dangling `next`, an unreachable node, a single-choice step and a cycle.
- **Every complete path** (1,461 + 2,592) ends at an ending, and every node lies on some path.
- Author rules: strong choices only positive evidence, harmful choices at least one −2, weak choices a
  negative sum, every glossary reference exists.
- The all-strong path in each scenario is ready, submission passes, no mistakes, and every assessed
  dimension meets the standard.
- Journey 1 in the engine: weak opening plus sending CVs leads to "Trust lost before the search began",
  the consequence, two mistakes with the stronger option, consent "Needs work", not ready; replay from
  step 2 keeps the first step, continues at the opening, and the original attempt is unchanged.
- Journey 2 in the engine: a near-perfect screening without consent fails readiness on the consent
  item alone; **exhaustively, no path without recorded consent is ever ready**; pressured consent is
  not consent; unfinished attempts are never ready.
- Play rules (unknown choices, choices after the end), band thresholds, rubric evidence lists.
- History: valid round trip; forged steps, unknown scenario, wrong finished state, extra keys and a
  dangling current id are rejected; the 200-attempt cap keeps the newest.

### Defects found while building (fixed)

- The all-strong client path rated "candidate consent: Developing" from a +1 in the closing summary,
  which misrepresented a path where consent was never tested; that evidence was removed, so the band is
  "Not assessed on this path".
- At 375 px the Rubric page scrolled sideways (the band table was not in a scroll container).
- Choices that are quoted lines were wrapped in a second pair of quotes in feedback, review and the
  rubric evidence.
- Readiness repeated the item label as "Missing: …"; it now says "Not recorded on this call".

### Playwright (production build under `/recruit-sim/`)

1. Journey 1: weak answer, harmful follow-up, realistic ending and consequence, not ready, consent
   "Needs work", no percentage anywhere; review shows two mistakes with stronger options; replay from step
   2 with strong answers reaches "Call wrap-up", ready, practice start passes; history lists both.
2. Journey 2: screening without consent ends "Not ready" with only the consent item failing while
   relevance meets the standard; "Try to submit" shows the exact blocker; replay from the consent step,
   respecting the candidate’s "not yet", becomes ready.
3. Pressured consent is recorded and blocks readiness.
4. Keyboard only: a whole scenario played with Tab and Enter; focus lands on "What happened" after
   each choice; the focused element has a visible outline.
5. Coaching: headings in the order missing / known / suggestion; opening it is counted and does not
   change the evaluation.
6. Resume after reload; glossary link focuses the term; clear history with confirmation.
7. A forged stored history is kept aside and reported; unknown attempt ids show an empty state.
8. No horizontal page scroll at 375 px on play, home, history, rubric, glossary and about.
9. Screenshots in `docs/screenshots` (home, play with coaching, ending, review, mobile play, dark play),
   inspected.

### Not tested

- Firefox, Safari, a real screen reader session.
- CI and Pages workflows (no remote).
