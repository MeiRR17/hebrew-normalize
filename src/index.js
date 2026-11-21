/**
 * Stable normalization options. Stages scheduled for later versions are
 * deliberately disabled until implemented, rather than silently ignored.
 * @typedef {object} NormalizeHebrewOptions
 * @property {boolean} [removeMarks=false] Remove niqqud and cantillation (v2).
 * @property {boolean} [foldFinalLetters=false] Fold ךםןףץ to כמנפצ (v2).
 * @property {boolean} [normalizeQuotes=false] Normalize Hebrew-context quotes (v3).
 * @property {boolean} [stripPunctuation=false] Remove Unicode punctuation (v3).
 * @property {boolean} [removeDirectionMarks=true] Remove invisible bidi controls.
 * @property {boolean} [collapseWhitespace=true] Trim and collapse whitespace.
 */

/** @type {Readonly<Required<NormalizeHebrewOptions>>} */
export const DEFAULT_OPTIONS = Object.freeze({
  removeMarks: false,
  foldFinalLetters: false,
  normalizeQuotes: false,
  stripPunctuation: false,
  removeDirectionMarks: true,
  collapseWhitespace: true,
});

const DIRECTION_MARKS = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu;
const PENDING_STAGES = new Set([
  'removeMarks', 'foldFinalLetters', 'normalizeQuotes', 'stripPunctuation',
]);

/**
 * Normalize Hebrew text deterministically without changing the input string.
 *
 * v1 supports independent bidi-control removal and whitespace collapsing.
 * Unsupported future stages reject an enabled value rather than silently
 * claiming to normalize text. False values are accepted for forward-compatible
 * configuration. Unknown options and non-boolean option values are errors.
 *
 * @param {string} text Input text (may include other scripts).
 * @param {NormalizeHebrewOptions} [options={}] Stage overrides.
 * @returns {string} Normalized text.
 * @throws {TypeError} For invalid input or option types.
 * @throws {RangeError} For unknown or not-yet-implemented enabled options.
 */
export function normalizeHebrew(text, options = {}) {
  if (typeof text !== 'string') {
    throw new TypeError('normalizeHebrew: text must be a string');
  }
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('normalizeHebrew: options must be an object');
  }

  const config = { ...DEFAULT_OPTIONS };
  for (const [name, value] of Object.entries(options)) {
    if (!Object.hasOwn(DEFAULT_OPTIONS, name)) {
      throw new RangeError('normalizeHebrew: unknown option "' + name + '"');
    }
    if (typeof value !== 'boolean') {
      throw new TypeError('normalizeHebrew: option "' + name + '" must be boolean');
    }
    if (PENDING_STAGES.has(name) && value) {
      throw new RangeError('normalizeHebrew: option "' + name + '" is not supported in v1');
    }
    config[name] = value;
  }

  let output = text;
  if (config.removeDirectionMarks) output = output.replace(DIRECTION_MARKS, '');
  if (config.collapseWhitespace) output = output.replace(/\s+/gu, ' ').trim();
  return output;
}
