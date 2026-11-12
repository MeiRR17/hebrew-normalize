# DECISIONS

## 2026-11-12 — Scope and execution
- Use one repository (`MeiRR17/hebrew-normalize`) and one working branch (`autopilot`); do not create other branches, forks, or pull requests.
- The library and CLI are both in scope. Implement and verify them in six sequential, self-contained versions so shared files are not edited by parallel version workers.
- Use the public library interface `normalizeHebrew(text, options = {})` with named Boolean options: `removeMarks`, `foldFinalLetters`, `normalizeQuotes`, `stripDirectionMarks`, `collapseWhitespace`, and `stripPunctuation`.
- Defaults: `removeMarks=true`, `foldFinalLetters=false`, `normalizeQuotes=true`, `stripDirectionMarks=true`, `collapseWhitespace=true`, `stripPunctuation=false`. Every stage can be disabled, and no stage requires any third-party package.
- `normalizeHebrew` accepts strings and throws `TypeError` for other input; it is deterministic, does not mutate inputs, and is idempotent. Keep the original script when a feature is disabled; do not transliterate Hebrew or apply compatibility normalization.
- Only canonicalize quote variants in Hebrew context: output Hebrew geresh U+05F3 and gershayim U+05F4, preserving unrelated Latin quoting. `stripPunctuation` uses Unicode punctuation classes, including Hebrew maqaf/geresh/gershayim. Fixtures determine the precise boundary cases.
- Remove Hebrew combining marks rather than all Unicode combining marks. Strip directional formatting and isolate controls, not arbitrary invisible characters. Collapse Unicode whitespace runs to one ASCII space and trim edges.
- Apply stages in this order: remove marks, fold final letters, normalize quotes, strip direction marks, strip punctuation, collapse whitespace.
- The CLI uses text from positional arguments or UTF-8 stdin; `--json` writes one JSON object `{"normalized":"..."}`. Exit codes: 0 success/help, 2 invalid usage, 1 I/O or runtime failure.
- Test with built-in `node --test` and committed fixtures, with no npm dependencies or devDependencies. Release readiness requires documented CLI and API behavior, examples, MIT licensing, and a clean privacy/security check.
- Current repository contains only an initial two-line README; no code version can be marked complete yet.
