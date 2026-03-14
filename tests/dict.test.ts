import { describe, expect, it } from 'vitest';
import { parseWords } from '../src/dict';

describe('parseWords', () => {
  it('splits content into trimmed non-empty words', () => {
    expect(parseWords('hello\nworld\n')).toEqual(['hello', 'world']);
  });

  it('trims whitespace from each line', () => {
    expect(parseWords('  foo  \n  bar  ')).toEqual(['foo', 'bar']);
  });

  it('filters out blank lines', () => {
    expect(parseWords('one\n\n\ntwo\n\nthree')).toEqual(['one', 'two', 'three']);
  });

  it('returns empty array for empty content', () => {
    expect(parseWords('')).toEqual([]);
  });

  it('handles single word without newline', () => {
    expect(parseWords('hello')).toEqual(['hello']);
  });
});
