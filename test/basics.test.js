import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { DEFAULT_OPTIONS, normalizeHebrew } from '../src/index.js';

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/basics.json', import.meta.url), 'utf8'));

for (const { name, input, options, expected } of fixtures) {
  test(name, () => {
    assert.equal(normalizeHebrew(input, options), expected);
    assert.equal(normalizeHebrew(normalizeHebrew(input, options), options), expected);
  });
}

test('input types are validated', () => {
  for (const input of [null, undefined, 5, {}, [], true]) {
    assert.throws(() => normalizeHebrew(input), TypeError);
  }
});

test('options must be an object with known boolean values', () => {
  for (const options of [null, 'x', 5, [], true]) {
    assert.throws(() => normalizeHebrew('שלום', options), TypeError);
  }
  assert.throws(() => normalizeHebrew('שלום', { collapseWhitespace: 'yes' }), TypeError);
  assert.throws(() => normalizeHebrew('שלום', { madeUp: true }), RangeError);
});

test('planned stages are declared but cannot be enabled prematurely', () => {
  for (const name of ['removeMarks', 'foldFinalLetters', 'normalizeQuotes', 'stripPunctuation']) {
    assert.equal(DEFAULT_OPTIONS[name], false);
    assert.throws(() => normalizeHebrew('שלום', { [name]: true }), RangeError);
  }
});

test('defaults are stable and immutable', () => {
  assert.ok(Object.isFrozen(DEFAULT_OPTIONS));
  assert.equal(DEFAULT_OPTIONS.removeDirectionMarks, true);
  assert.equal(DEFAULT_OPTIONS.collapseWhitespace, true);
});
