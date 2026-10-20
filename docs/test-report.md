# Test report

## Part 1: independent acceptance (2026-10-19)

Reviewer: a separate Claude Code session that did not write the code, starting from commit `e699db7`
on `phase/07a-build`. Windows 10, Node 24.20.0, PowerShell 5.1, Playwright 1.64 with the installed
Microsoft Edge (`msedge`). Nothing was pushed, published or deployed; there is no remote.

### Commands and exit codes

| #   | Command                                                                               | Exit  | Result                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `git status` at `e699db7`                                                             | 0     | clean working tree                                                                                                                        |
| 2   | `powershell -File scripts\verify.ps1 *>&1` (output redirected to a file), as received | 0     | `ALL CHECKS PASSED`: 19 unit, 9 e2e; npm stderr warnings appear as NativeCommandError text but each step is judged by its exit code       |
| 3   | fresh `git clone` into a scratch folder, then `scripts\verify.ps1 *>&1` there         | 0     | `ALL CHECKS PASSED` from a clean install (19 unit, 9 e2e)                                                                                 |
| 4   | clone: a unit-test expectation changed, then `sh scripts/verify.sh`                   | 1     | stops at "unit tests" (1 failed, 18 passed); e2e not run                                                                                  |
| 5   | clone: same broken test, `scripts\verify.ps1 *>&1`                                    | 1     | `FAILED: unit tests (exit 1)`                                                                                                             |
| 6   | clone: test restored, a badly formatted line appended to `src/main.tsx`, `verify.ps1` | 1     | `FAILED: format check (exit 1)`                                                                                                           |
| 7   | `npx playwright test -g "<4 new regression tests>"` with the fixed `src` stashed      | 1     | all 4 new regression tests fail on the original code (they detect the defects)                                                            |
| 8   | same for the mobile/status regression test                                            | 1     | fails on the original code                                                                                                                |
| 9   | `powershell -File scripts\verify.ps1 *>&1` after the fixes (first try)                | -4048 | `FAILED: install (lockfile)`: a preview server left running by the reviewer locked a native module; the script failed loudly as it should |
| 10  | same, after stopping that server                                                      | 0     | `ALL CHECKS PASSED`: 21 unit, 14 e2e, build 372 kB JS (114 kB gzip), secret scan clean, 0 vulnerabilities                                 |
| 11  | fresh clone pulled to the final commit, `scripts\verify.ps1 *>&1`                     | 0     | `ALL CHECKS PASSED` (see "Final clean-clone run" below)                                                                                   |
| 12  | `npm run secrets` after writing this report                                           | 0     | `secret-scan: no findings`                                                                                                                |

The scratch clone was deleted afterwards. Ports 4179 and 5178 were free at the end.

### Journeys exercised on the production build under `/recruit-sim/` (port 4179)

- **Client discovery, weak answer:** research, "I'll send five CVs this afternoon" (weak), "Email Dana
  the five CVs" (harmful) ends in "Trust lost before the search began" with the candidate complaint,
  kick-off readiness Not ready, candidate consent "Needs work". Review lists both mistakes with the
  stronger option; replay from step 2 with the strong answers reaches "Call wrap-up", Ready, and the
  practice start passes. History keeps both attempts.
- **Candidate screening without consent:** a near-perfect call with "I'll send it over to the client
  this afternoon" ends Not ready with only the consent item failing; "Try to submit" is blocked with
  that item named. Replay from the consent step (ask, accept the "not yet", confirm) is Ready.
- **Illegal submission states:** exhaustively (unit test) no path without recorded consent is ready;
  a forged stored attempt following a no-consent path loads and is Not ready (results are recomputed);
  forged steps, corrupted JSON and an over-long history are kept aside and reported. Before the fix
  below, a passed check could be shown on a no-consent replay.
- **Static release:** asset URLs use `/recruit-sim/`; deep links `#/play/<id>`, `#/review/<id>`,
  `#/glossary/<term>` work after a reload; unknown attempts, routes and terms now say so.

### Defects found and fixed (each with a regression test)

1. **A "Practice check passed" message carried over to a replayed attempt without consent.** After
   passing the submission check and replaying from the consent step into "I'll send it over", the
   ending showed "Not ready" next to the old green "Practice check passed" (the Play view was not
   reset between attempts). Play is now keyed by attempt. (e2e)
2. **Two open tabs lost data.** Each tab saved its own copy of the history, so an attempt started in
   one tab was erased by the other, and an attempt deleted in one tab was restored by the other. The
   app now adopts history saved by another tab (storage event); a deleted attempt shows "Attempt not
   found" in the other tab. (e2e)
3. **Focus was lost** (to the page body) after starting an attempt, replaying from step 1, deleting an
   attempt or clearing history. Focus now goes to the step heading or the History heading. (e2e)
4. **Mobile tables hid the evidence.** At 320–640 px the rubric "Evidence" column and the History
   Review/Delete buttons were scrolled out of view inside their tables (cells were `nowrap`). Rows now
   stack with labelled values. (e2e at 320 px)
5. **Status messages followed the learner** ("Scenario finished…" shown on History and Review). A
   message now shows only on the page it belongs to. (e2e)
6. **Unknown routes and terms** silently showed the home page or the full glossary; the missing-attempt
   state had no heading. Now: "Page not found", "Attempt not found", and a note for an unknown term.
   (e2e)
7. **Scenario coherence** (every choice was read): three explanations named no rubric dimension
   (`fees-first`, `dismiss`, `accuse`); the `dismiss` consequence only dropped the PhD yet recorded
   "Must-haves agreed and realistic"; the `ultimatum` explanation contradicted the "fee terms in writing"
   flag it sets; the strong salary-history answer claimed "you've given me" expectations that paths
   through "dodge" or "invent" never asked for; the pay-misrepresentation consequence ("she withdraws")
   contradicted a later recorded consent on the same path. Texts corrected; a unit test now requires
   every explanation to name at least one dimension the choice affects.
8. `coachViews` is capped at the schema limit so a very long session cannot invalidate stored history.

README corrected: not every step has glossary links (both closing steps have none), and explanations
name the main dimension while the evidence chips show every dimension.

### Checked and found sound

- README counts recomputed from the data: 7 phases each; 8 and 10 step nodes; 2 and 1 endings; 1,461
  and 2,592 complete paths (4,053); longest paths 8 and 10 steps; every step has 2 or 3 choices and a
  strong one; every node is reachable, no cycles or dead ends.
- Readiness rules against every choice: only `confirm` (after ask and hold) records consent; pressured,
  assumed, broadcast and "send anyway" choices set flags the consent item forbids.
- Keyboard: skip link, start, coaching toggle (Enter and Space, `aria-expanded`), every choice, glossary
  link (focuses the term) and back, replay buttons, history Delete; focus outline 3 px, visible in
  light and dark. Headings: one h1, an h2 per page, h3 per step/section; `role="status"` live region,
  `role="alert"` for errors and the practice-check result; all controls have accessible names.
- Persistence: reload mid-attempt resumes at the same node; 200-attempt cap with unfinished attempts;
  corrupted JSON kept aside, downloadable, dismissible; export downloads valid JSON; export is disabled
  when empty.
- Screenshots taken and inspected at 320, 375, 768 and 1440 px in light and dark (home, play with
  coaching, ending, history) plus focus states; no horizontal page scroll at any width.
- Ethics: all people and companies (Dana Whitfield, Mina Osei-Laurent, Northlight Talent, Harbor & Pine
  Logistics, Brightwell Freight, "AutoStack") are labelled fictional in the scenario or banner; no
  automated decision about real people; banner, rubric caption, About and footer deny certification and
  legal compliance; glossary and coaching present law as differing by jurisdiction ("many laws", "some
  places", "a question for a lawyer").
- LICENSE (MIT), SECURITY, CONTRIBUTING, AI_ASSISTANCE present; no third-party assets, fonts or network
  calls; secret scan of tree clean; git history contains no keys (only the commit author metadata).
- Committed screenshots match the current UI; `review-desktop.png` was regenerated because fix 5 removed
  a stale status line from it.

### Remaining issues (not blockers)

- Deleting a single attempt has no confirmation; there is no history import (export only).
- Two tabs writing in the same instant could still lose one write (storage events are asynchronous).
- On the ending screen the readiness heading is an h3 inside the ending h3 section, and "Replay a
  different branch" is an h4 after it; the outline is readable but not strictly nested.
- `vite preview` serves `index.html` for unknown paths; GitHub Pages will return its own 404 for a
  path (not hash) that does not exist. No favicon (the browser's request 404s harmlessly).
- Not tested: Firefox, Safari, a real screen reader, CI and Pages workflows (no remote).

### Final clean-clone run

The scratch clone was pulled to commit `e23eea6` (code identical to the final commit, which only adds
this paragraph) and `scripts\verify.ps1 *>&1` was run there: exit code **0**, `ALL CHECKS PASSED`
(`npm ci` 0 vulnerabilities, format, lint, typecheck, 21 unit tests, build, secret scan clean, 14
Playwright tests on the production build under `/recruit-sim/`). The clone was then deleted.

## Part 2: builder's report (2026-10-19)

Windows 10, Node 24, Playwright 1.64 with the installed Microsoft Edge (`msedge` channel). CI is
configured for Chromium on Ubuntu but has never run (no remote).

### Full gate

`powershell -File scripts/verify.ps1`, exit code **0** (`ALL CHECKS PASSED`):

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

## Publication and final audit

The notes above that CI and Pages "have never run (no remote)" describe the state before
publication and are superseded:

- 2026-10-19: public repository https://github.com/PatrickNDevelopment/recruit-sim created from the verified commit on `main`; the first CI run
  (Ubuntu, Chromium) and the first Pages deployment were green. A live check of https://patrickndevelopment.github.io/recruit-sim/ loaded the
  app, reloaded it, and found no console errors and no requests to localhost.
- 2026-10-20: the final cross-portfolio audit (a separate Claude Code session) ran the main journey
  on the live demo, found no P0 or P1 issue, and saw the last three CI runs green.
