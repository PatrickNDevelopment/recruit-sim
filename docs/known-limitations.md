# Known limitations

- **Authored branches only.** You choose from written answers; there is no free-text response and no
  role-play partner that adapts beyond the authored branches.
- **One practice viewpoint.** The rubric and explanations reflect common good practice. Employment,
  discrimination and data-protection law differs by country; nothing here is legal advice.
- **Two scenarios.** Enough for the two required journeys and the listed difficult cases, not a
  curriculum.
- **Bands are coarse by design.** They summarise the evidence on one path; they are not a measure of
  skill and are not comparable between people.
- **History is per browser** (`localStorage`). Clearing site data removes it; export it to keep it.
  At most 200 attempts are kept (oldest finished attempts are dropped first).
- **No import.** History can be exported as JSON but not imported back.
- **Deleting one attempt** in History happens at once, without a confirmation (clearing all history
  asks first).
- **Two tabs** stay consistent through the browser's storage event; two tabs writing within the same
  instant could still lose one write.
- **English only.**
- **Tested** in Microsoft Edge (Chromium) on Windows; no screen-reader software session was run
  (structure was checked through accessible roles and names in Playwright).
- **Published 2026-10-19.** CI (Linux, Chromium) and the Pages deploy were green on the first run.
- **Shared browser storage on the demo site.** All ten portfolio demos are served from
  `patrickndevelopment.github.io`, so they share one browser storage quota (about 5 MB). Each app
  uses its own `recruit-sim.*` keys and only reacts to changes of its own keys, but a very large workspace
  in one demo can make saving fail in another (the app then shows its save-failed notice). A local
  run has its own origin and is not affected.
