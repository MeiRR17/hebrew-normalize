# STATUS

## Overall
- State: planning complete; implementation not started.
- Completed versions: 0/6.
- Repository: `MeiRR17/hebrew-normalize`.
- Working branch: `autopilot` only.
- Baseline inspected: `51f3203b3b988b05b96c1983557b1bbcce3bc153` (initial commit). Only the two-line starter `README.md` exists; no implementation, tests or packaging files were present.
- Next actionable version: v1 (all other versions depend sequentially on earlier versions).
- Verification: repository tree inspected; runtime tests not yet executed because project code does not exist.

## v1 — Library foundation
- Done: planning and acceptance criteria recorded.
- Remaining: Node/ESM package configuration, library API, two baseline optional steps, fixtures and tests.
- State: not started.

## v2 — Niqqud and final letters
- Done: planning and acceptance criteria recorded.
- Remaining: Hebrew marks filtering, final-letter folding, isolated options and fixtures.
- State: blocked on v1.

## v3 — Quotes and punctuation
- Done: planning and acceptance criteria recorded.
- Remaining: Hebrew-context quote canonicalization, optional punctuation removal, processing order and fixtures.
- State: blocked on v2.

## v4 — CLI and JSON output
- Done: planning and acceptance criteria recorded.
- Remaining: CLI executable, flags, stdin support, help, JSON shape, exit codes and CLI tests.
- State: blocked on v3.

## v5 — Examples, README and MIT license
- Done: planning and acceptance criteria recorded.
- Remaining: complete README, examples, MIT license and publication metadata.
- State: blocked on v4.

## v6 — End-to-end validation and release readiness
- Done: planning and acceptance criteria recorded.
- Remaining: integration fixtures, runtime and packaging verification, consistency and privacy audit, final review.
- State: blocked on v5.
