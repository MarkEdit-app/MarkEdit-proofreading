import { describe, expect, it } from 'vitest';
import { kindCSS, kindColors, kindColorsDark } from '../src/styling';

describe('kindCSS', () => {
  it('includes fallback rules and dark mode section', () => {
    const css = kindCSS();
    expect(css).toContain('.cm-harper-lint { text-decoration: underline solid #6c757daa 2px;');
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('.cm-harper-lint { text-decoration: underline solid #B8C0CCaa 2px;');
  });

  it('includes per-kind lint and badge colors', () => {
    const css = kindCSS();
    expect(css).toContain('.cm-harper-lint[data-lint-kind="Style"] { text-decoration: underline solid #C49000aa 2px;');
    expect(css).toContain('.harper-badge[data-kind="Style"] { color: #C49000; background-color: #C4900022; }');
  });

  it('generates rules for every kind in kindColors', () => {
    const css = kindCSS();
    for (const kind of Object.keys(kindColors)) {
      expect(css).toContain(`data-lint-kind="${kind}"`);
      expect(css).toContain(`data-kind="${kind}"`);
    }
  });

  it('includes hover and active states for each kind', () => {
    const css = kindCSS();
    for (const kind of Object.keys(kindColors)) {
      expect(css).toContain(`.cm-harper-lint[data-lint-kind="${kind}"]:hover`);
      expect(css).toContain(`.cm-harper-lint[data-lint-kind="${kind}"]:active`);
    }
  });

  it('every kind in kindColors has a dark variant', () => {
    for (const kind of Object.keys(kindColors)) {
      expect(kindColorsDark).toHaveProperty(kind);
    }
  });
});
