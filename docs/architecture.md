# Architecture and decisions

Specification: [spec/00-scenarios-rubric-readiness.md](spec/00-scenarios-rubric-readiness.md).

```
src/
  engine/      pure logic (unit tested): types, validate (structure, all paths), play (choose,
               replay, rubric, readiness, mistakes, endings), history (schema), glossary
  scenarios/   authored content as data: clientDiscovery, candidateScreening
  lib/         storage (validated localStorage), downloads
  ui/          Play (step, feedback, coaching, ending), Results (rubric, readiness),
               Pages (home, review, history, glossary, rubric, about)
  App.tsx      routing (hash), persistence, focus handling
```

## Decisions

1. **Scenarios are data, validated.** Content and code are separate; `validateScenario` enforces
   reachability, no cycles, no dead ends, at least two choices and one strong choice per step, declared
   flags and dimensions. Tests enumerate every complete path (4,053) and check each ends properly.
2. **Results are recomputed, never stored.** An attempt stores only its steps; flags, rubric bands,
   readiness, endings and mistakes are derived from the scenario. Stored history cannot carry forged
   scores, and a stored attempt whose steps do not follow the scenario is rejected on load.
3. **Readiness is separate from the rubric.** Readiness items are rules over recorded facts (flags).
   No combination of good answers can compensate for missing consent. This mirrors practice: a
   submission without consent is not "mostly fine".
4. **Bands, not percentages.** The rubric shows per-dimension evidence and a band with published
   thresholds, plus "Not assessed on this path" where a path never tested a dimension. No overall score:
   the tool must not look like a certification.
5. **Consistency rules for authors** (tested): strong choices only carry positive evidence, harmful
   choices carry at least one −2, weak choices sum below zero, and the all-strong path is ready and
   meets the standard wherever assessed.
6. **Replay creates a new attempt** with the earlier steps copied; the original stays in history so
   learners can compare.
7. **Coaching is authored text** with a fixed order: missing information, known information, then a
   suggested action. No AI service; opening it is counted but does not change the evaluation.
8. **Accessibility by construction**: real buttons for choices, focus moved to "What happened" after
   each choice, headings per step, readable status messages, visible focus, no colour-only signals
   (✓/✗ plus text).
9. **Static hosting**: hash routing with attempt ids in the URL, `base: /recruit-sim/`, no backend.

## Ports

5178 dev, 4179 production preview (e2e).
