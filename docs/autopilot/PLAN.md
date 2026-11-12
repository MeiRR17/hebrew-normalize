# PLAN
מטרה: Build and publish a small, zero-dependency Hebrew text normalizer for search as a tested ES-module library and CLI.

## v1 — Library foundation
repo: MeiRR17/hebrew-normalize
after: none
- [ ] Add package.json with Node.js >=22, ES modules, library exports, `node --test` script, and no dependencies or devDependencies.
- [ ] Implement `src/index.js` with a pure `normalizeHebrew(text, options = {})` export, complete JSDoc, string-input validation, and individually switchable whitespace collapsing and bidi-direction-mark removal.
- [ ] Define the stable options object and defaults for all planned stages without exposing unfinished functionality as working.
- [ ] Add `test/fixtures/basics.json` and `test/basics.test.js` covering whitespace, bidi marks, unchanged text with disabled stages, invalid input, and idempotence.
Done when: `node --test` passes on Node.js 22+; `import { normalizeHebrew } from './src/index.js'` works; no package dependencies exist; v1 fixture cases pass.

## v2 — Niqqud and final letters
repo: MeiRR17/hebrew-normalize
after: v1
- [ ] Extend the library with optional `removeMarks` that removes Hebrew niqqud and cantillation (including decomposed sequences) without deleting Hebrew consonants or non-Hebrew text.
- [ ] Add optional `foldFinalLetters` mapping ך/ם/ן/ף/ץ to כ/מ/נ/פ/צ; leave it disabled by default.
- [ ] Add `test/fixtures/marks.json`, `test/fixtures/final-letters.json`, and fixture-driven tests for each stage alone and for disabled behavior.
- [ ] Cover representative Hebrew vowels, accents, shin/sin dots, mixed-language strings, and repeated application.
Done when: `node --test` passes; both stages can be independently toggled and their fixture tests establish the exact character mappings.

## v3 — Quotes and punctuation
repo: MeiRR17/hebrew-normalize
after: v2
- [ ] Implement independently switchable `normalizeQuotes` that canonicalizes common single/double quote variants to Hebrew geresh (׳) and gershayim (״) in Hebrew context while preserving unrelated Latin quotation marks.
- [ ] Implement optional `stripPunctuation` (default off) using Unicode punctuation categories, including Hebrew punctuation, without stripping letters, numbers, or symbols.
- [ ] Fix and document processing order: marks, final letters, Hebrew-context quotes, bidi marks, punctuation, then whitespace.
- [ ] Add `test/fixtures/quotes.json` and `test/fixtures/punctuation.json` with standalone on/off tests, mixed Hebrew/English text, geresh/gershayim, maqaf, and option combinations.
Done when: `node --test` passes; punctuation and quote rules are independently tested by committed fixtures, and standard Hebrew abbreviations normalize consistently.

## v4 — CLI and JSON output
repo: MeiRR17/hebrew-normalize
after: v3
- [ ] Add executable `bin/hebrew-normalize.js` and a package.json `bin` mapping, importing the public library API without external packages.
- [ ] Accept positional text or UTF-8 stdin; implement `--help`, `--json`, `--no-marks`, `--final-letters`, `--no-quotes`, `--no-direction-marks`, `--no-whitespace`, and `--strip-punctuation`.
- [ ] Define plain-text output as normalized text plus newline and JSON output as one valid object with a `normalized` string; send errors to stderr.
- [ ] Return exit code 0 for success/help, 2 for invalid usage/flags, and 1 for input or execution errors; reject missing input without hanging.
- [ ] Add `test/fixtures/cli.json` and `test/cli.test.js` running the CLI through Node child processes for stdin, arguments, option switches, JSON, help, and exit codes.
Done when: `node bin/hebrew-normalize.js --help` succeeds, the package exposes its CLI through `bin`, and `node --test` passes all CLI fixtures without installs.

## v5 — Examples, README and MIT license
repo: MeiRR17/hebrew-normalize
after: v4
- [ ] Replace the starter README.md with polished English documentation: pitch, motivation, feature/default-option table, installation-free quick start, library and CLI usage, tests, and project structure.
- [ ] End README.md with an `Author` section containing exactly `Built by Meir Dvir · [https://github.com/MeiRR17](https://github.com/MeiRR17)`.
- [ ] Add `LICENSE` with the MIT license and copyright 2026 Meir Dvir.
- [ ] Add runnable `examples/basic.mjs` and `examples/options.mjs` using the public API, with examples documented in README.
- [ ] Set accurate package name, version, license, engines, exports, bin, description and files metadata without dependencies, placeholders or publishing claims that were not verified.
Done when: both `node examples/basic.mjs` and `node examples/options.mjs` run on Node.js 22+, README commands match working files, LICENSE is complete, and `node --test` passes.

## v6 — End-to-end validation and release readiness
repo: MeiRR17/hebrew-normalize
after: v5
- [ ] Add `test/fixtures/integration.json` and `test/integration.test.js` covering combined stages, independent opt-outs, Unicode direction controls, multiline whitespace, mixed scripts, and idempotence.
- [ ] Verify library import and direct CLI invocation using only Node.js built-ins; ensure `--json` output is parseable and errors do not contaminate stdout.
- [ ] Run `node --test` and `npm pack --dry-run` on Node.js 22+ with no dependency installation; fix only issues proven by these checks.
- [ ] Audit tracked files for secrets, private data, misleading claims, placeholder sections, and unexpected dependencies; reconcile README, JSDoc, CLI help and fixtures.
- [ ] Record final verified outcomes in `docs/autopilot/STATUS.md` and any review findings in `docs/autopilot/REVIEWS.md` without marking incomplete tasks as done.
Done when: `node --test` is green, packaging dry-run contains only intended files, all documented commands work, all six versions' checklist items are verifiably complete on `autopilot`, and no secrets or placeholder sections are present.
