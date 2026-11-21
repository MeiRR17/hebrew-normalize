import { normalizeHebrew, PRESETS } from './index.js';

const MAX_DOCUMENT_CHARS = 2_000_000;
const MAX_NONEMPTY_LINES = 10_000;

/**
 * Group nonempty source lines whose *complete normalized text* matches.
 *
 * This is text equality after the chosen Unicode normalization, not a
 * linguistic similarity score and not a fuzzy or stem-based search.
 * Numbered lines refer to the original text, even when blank lines exist.
 * No original line text is returned, stored or transmitted.
 *
 * @param {string} source Newline-delimited source lines.
 * @param {object} options The same boolean options as normalizeHebrew.
 * @returns {object} Count summary and groups of normalized keys/line numbers.
 */
export function findDuplicateLines(source, options = PRESETS.search) {
  if (typeof source !== 'string' || source.length > MAX_DOCUMENT_CHARS) {
    throw new RangeError('Input must contain at most 2,000,000 characters.');
  }
  const lines = source.split(/\r\n?|\n/u);
  const byKey = new Map();
  let nonEmptyLines = 0;
  let normalizedEmpty = 0;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;
    nonEmptyLines++;
    if (nonEmptyLines > MAX_NONEMPTY_LINES) {
      throw new RangeError('Duplicate analysis supports at most 10,000 non-empty lines.');
    }
    const normalized = normalizeHebrew(raw, options);
    // Do not group lines containing only marks eliminated by normalization.
    if (!normalized.trim()) { normalizedEmpty++; continue; }
    const record = byKey.get(normalized);
    if (record) record.lines.push(i + 1);
    else byKey.set(normalized, { normalized, lines: [i + 1] });
  }

  const groups = [...byKey.values()]
    .filter(group => group.lines.length > 1)
    .map(group => ({
      normalized: group.normalized,
      lines: [...group.lines],
      occurrences: group.lines.length,
    }));
  const duplicateLines = groups.reduce((sum, group) => sum + group.occurrences, 0);
  return {
    sourceLineCount: lines.length,
    nonEmptyLines,
    normalizedEmpty,
    distinctKeys: byKey.size,
    duplicateGroups: groups.length,
    duplicateLines,
    // Extra occurrences after keeping one representative from each group.
    redundantLines: groups.reduce((sum, group) => sum + group.occurrences - 1, 0),
    groups,
  };
}

/** A counts-only report suitable for logging without source content. */
export function duplicateSummary(result) {
  if (!result || !Array.isArray(result.groups)) {
    throw new TypeError('Expected duplicate analysis output.');
  }
  const { sourceLineCount, nonEmptyLines, normalizedEmpty, distinctKeys,
    duplicateGroups, duplicateLines, redundantLines } = result;
  return { sourceLineCount, nonEmptyLines, normalizedEmpty, distinctKeys,
    duplicateGroups, duplicateLines, redundantLines };
}


/**
 * Produce counts without constructing groups of normalized keys or source
 * line numbers in the returned result. Keys are temporarily held in a Map
 * for exact matching, but never leave this function.
 *
 * This does not identify meaningful linguistic duplicates; it uses the same
 * normalization rules and bounded inputs as findDuplicateLines().
 */
export function summarizeDuplicateLines(source, options = PRESETS.search) {
  if (typeof source !== 'string' || source.length > MAX_DOCUMENT_CHARS) {
    throw new RangeError('Input must contain at most 2,000,000 characters.');
  }
  const lines = source.split(/\r\n?|\n/u);
  const frequencies = new Map();
  let nonEmptyLines = 0, normalizedEmpty = 0;
  let duplicateGroups = 0, duplicateLines = 0, redundantLines = 0;
  for (const raw of lines) {
    if (!raw.trim()) continue;
    nonEmptyLines++;
    if (nonEmptyLines > MAX_NONEMPTY_LINES) {
      throw new RangeError('Duplicate analysis supports at most 10,000 non-empty lines.');
    }
    const key = normalizeHebrew(raw, options);
    if (!key.trim()) { normalizedEmpty++; continue; }
    const previous = frequencies.get(key) ?? 0;
    frequencies.set(key, previous + 1);
    if (previous === 1) {
      duplicateGroups++;
      duplicateLines += 2;
      redundantLines++;
    } else if (previous > 1) {
      duplicateLines++;
      redundantLines++;
    }
  }
  return {
    sourceLineCount: lines.length,
    nonEmptyLines,
    normalizedEmpty,
    distinctKeys: frequencies.size,
    duplicateGroups,
    duplicateLines,
    redundantLines,
  };
}
