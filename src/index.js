/**
 * Hebrew normalization for search, comparison and display.
 * No dependencies, network requests, linguistic stemming or transliteration.
 * Input content never leaves the caller's process.
 */
export const DEFAULT_OPTIONS = Object.freeze({
  removeNiqqud: true,
  removeCantillation: true,
  normalizePresentation: true,
  expandYiddish: true,
  normalizeFinalLetters: false,
  removeBidiControls: true,
  normalizePunctuation: true,
  normalizeMaqaf: true,
  collapseWhitespace: true,
  trim: true,
});
export const PRESETS = Object.freeze({
  search: Object.freeze({ ...DEFAULT_OPTIONS, normalizeFinalLetters: true }),
  display: Object.freeze({
    ...DEFAULT_OPTIONS,
    removeNiqqud: false,
    removeCantillation: false,
    normalizeFinalLetters: false,
    collapseWhitespace: false,
    trim: false,
  }),
});
const MAX_LENGTH = 2_000_000;
const YIDDISH = new Map([
  ['\u05F0', '\u05D5\u05D5'], // double vav
  ['\u05F1', '\u05D5\u05D9'], // vav yod
  ['\u05F2', '\u05D9\u05D9'], // double yod
]);
const FINALS = new Map([
  ['\u05DA','\u05DB'], ['\u05DD','\u05DE'], ['\u05DF','\u05E0'],
  ['\u05E3','\u05E4'], ['\u05E5','\u05E6'],
]);
const PRESENTATION_FORMS = /[\uFB1D-\uFB4F]/gu;
const NIQQUD = /[\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]/gu;
const CANTILLATION = /[\u0591-\u05AF]/gu;
// LRM/RLM/ALM, embedding/override and isolates. Intentionally does not
// remove ZWJ/ZWNJ, which have different shaping responsibilities.
const BIDI_CONTROLS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/gu;

function validateOptions(input) {
  if (input === undefined) return DEFAULT_OPTIONS;
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Normalization options must be an object.');
  }
  for (const [name,value] of Object.entries(input)) {
    if (!Object.hasOwn(DEFAULT_OPTIONS, name)) throw new RangeError('Unknown option: ' + name);
    if (typeof value !== 'boolean') throw new TypeError('Option "' + name + '" must be boolean.');
  }
  return { ...DEFAULT_OPTIONS, ...input };
}
/** Unaccented Hebrew glyph comparison is a search option, not a display rule. */
function replaceMap(value,map) {
  return Array.from(value, character => map.get(character) || character).join('');
}
function normalizePunctuation(value) {
  // Treat ASCII and smart quotation marks between Hebrew letters as gershayim.
  // Do not rewrite English apostrophes or quotation marks.
  return value
    .replace(/([\u05D0-\u05EA])["\u201C\u201D]([\u05D0-\u05EA])/gu, '$1\u05F4$2')
    .replace(/([\u05D0-\u05EA])['\u2018\u2019](?=$|[^\p{L}])/gu, '$1\u05F3');
}

/**
 * Convert text into a stable, opt-in normalized string.
 * Intentionally does not delete punctuation globally or alter Arabic letters.
 */
export function normalizeHebrew(input, options) {
  if (typeof input !== 'string') throw new TypeError('Hebrew text must be a string.');
  if (input.length > MAX_LENGTH) throw new RangeError('Input exceeds 2,000,000 characters.');
  const config = validateOptions(options);
  let value = input;
  if (config.normalizePresentation) {
    value = value.replace(PRESENTATION_FORMS, character => character.normalize('NFKD'));
  }
  if (config.expandYiddish) value = replaceMap(value, YIDDISH);
  if (config.removeCantillation) value = value.replace(CANTILLATION, '');
  if (config.removeNiqqud) value = value.replace(NIQQUD, '');
  if (config.normalizeFinalLetters) value = replaceMap(value, FINALS);
  if (config.removeBidiControls) value = value.replace(BIDI_CONTROLS, '');
  if (config.normalizePunctuation) value = normalizePunctuation(value);
  if (config.normalizeMaqaf) value = value.replace(/\u05BE/gu, '-');
  if (config.collapseWhitespace) value = value.replace(/\s+/gu, ' ');
  if (config.trim) value = value.trim();
  return value;
}

/** Prepare a broad search index key. Both query and documents need this. */
export function searchKey(text) {
  return normalizeHebrew(text, PRESETS.search);
}

/** Normalize presentation marks and directional controls while keeping vowels. */
export function displayText(text) {
  return normalizeHebrew(text, PRESETS.display);
}

/** Return a report with counts and the normalized text (never log automatically). */
export function normalizeWithReport(text, options) {
  const normalized = normalizeHebrew(text, options);
  return {
    original: text,
    normalized,
    changed: text !== normalized,
    originalCodePoints: [...text].length,
    normalizedCodePoints: [...normalized].length,
    options: { ...validateOptions(options) },
  };
}
