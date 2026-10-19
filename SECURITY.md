# Security and ethics notes

RecruitSim is a static, browser-only app. It has no server, no accounts, no network calls, no AI
service and no secrets.

| Input                  | Treated as                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `localStorage` history | Untrusted. Strict schema; every stored attempt is replayed against its scenario and rejected if it does not follow it. An unreadable copy is kept aside and offered as a download. |
| URL hash (attempt ids) | Looked up in the local history only; unknown ids show an empty state.                                                                                                              |
| Scenario content       | Authored in the repository and validated structurally in tests; rendered as text, never as HTML.                                                                                   |

## Ethics

- No real people, employers or candidate data: every participant and company is fictional.
- No automated decision about any real candidate; readiness checks are practice exercises and send
  nothing anywhere.
- The app does not claim to certify recruiting competence or legal compliance, and shows no overall
  score or percentage.

Report problems through a private security advisory on the repository once it is published, or by
contacting the owner.
