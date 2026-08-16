// Pure helpers for dialect fallback suppression. Deliberately free of any harper.js import
// so it stays fast to unit test; lint.ts feeds it spans extracted from real Harper lints.

export interface SpanLike {
  start: number;
  end: number;
}

export function spanKey(span: SpanLike): string {
  return `${span.start}:${span.end}`;
}

// Decides whether a primary-dialect Spelling lint should survive fallback filtering.
// A misspelling is kept only when every fallback dialect also flags the same span; if any
// fallback considers the word valid (its span is absent), the word is an accepted spelling
// in that dialect and the lint is dropped.
export function keepSpellingLint(key: string, fallbackSpellingSpans: ReadonlySet<string>[]): boolean {
  return fallbackSpellingSpans.every(spans => spans.has(key));
}
