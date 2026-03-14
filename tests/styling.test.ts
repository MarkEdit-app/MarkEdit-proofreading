import { describe, expect, it } from 'vitest';
import { kindCSS } from '../src/styling';

describe('kindCSS', () => {
  it('includes fallback rules and dark mode section', () => {
    const css = kindCSS();
    expect(css).toMatch(/\.cm-content\s+::spelling-error[^}]*text-decoration:\s*none/i);
    expect(css).toMatch(/\.cm-content\s+::grammar-error[^}]*text-decoration:\s*none/i);
    expect(css).toContain('.cm-harper-lint { text-decoration: underline solid #6c757daa 2px;');
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('.cm-harper-lint { text-decoration: underline solid #9CA3AFaa 2px;');
  });

  it('includes per-kind lint and badge colors', () => {
    const css = kindCSS();
    expect(css).toContain('.cm-harper-lint[data-lint-kind="Style"] { text-decoration: underline solid #C49000aa 2px;');
    expect(css).toContain('.harper-badge[data-kind="Style"] { color: #C49000; background-color: #C4900022; }');
  });
});
