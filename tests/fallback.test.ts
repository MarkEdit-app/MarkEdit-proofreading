import { describe, expect, it } from 'vitest';
import { keepSpellingLint, spanKey } from '../src/fallback';

describe('dialect fallback suppression', () => {
  it('builds a stable span key', () => {
    expect(spanKey({ start: 11, end: 16 })).toBe('11:16');
  });

  it('keeps a spelling lint when no fallback dialects are configured', () => {
    expect(keepSpellingLint('11:16', [])).toBe(true);
  });

  it('drops a spelling that any fallback dialect accepts', () => {
    // "color" flagged by Australian primary, but absent from the American fallback set.
    const american = new Set(['0:3']);
    expect(keepSpellingLint('11:16', [american])).toBe(false);
  });

  it('keeps a genuine misspelling flagged by every fallback dialect', () => {
    const american = new Set(['11:16', '25:28']);
    const canadian = new Set(['11:16']);
    expect(keepSpellingLint('11:16', [american, canadian])).toBe(true);
  });

  it('drops the word unless every fallback flags it', () => {
    const american = new Set(['11:16']);
    const canadian = new Set<string>(); // Canadian accepts the word
    expect(keepSpellingLint('11:16', [american, canadian])).toBe(false);
  });
});
