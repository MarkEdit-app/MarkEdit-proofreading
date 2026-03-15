import { describe, expect, it } from 'vitest';
import { cardContentCSS } from '../src/card';

describe('cardContentCSS', () => {
  it('includes message, button, ignore, and actions styles', () => {
    const css = cardContentCSS();
    expect(css).toContain('.harper-msg');
    expect(css).toContain('.harper-btn');
    expect(css).toContain('.harper-ignore');
    expect(css).toContain('.harper-actions');
  });

  it('uses CSS custom properties for accent-colored code', () => {
    const css = cardContentCSS();
    expect(css).toMatch(/\.harper-msg\s+code\s*\{[^}]*var\(--harper-kind-color/);
    expect(css).toMatch(/\.harper-msg\s+code\s*\{[^}]*color-mix/);
  });

  it('includes hover and active states for buttons', () => {
    const css = cardContentCSS();
    expect(css).toContain('.harper-btn:hover');
    expect(css).toContain('.harper-btn:active');
    expect(css).toContain('.harper-ignore:hover');
    expect(css).toContain('.harper-ignore:active');
  });

  it('includes dark mode overrides', () => {
    const css = cardContentCSS();
    expect(css).toContain('@media (prefers-color-scheme: dark)');
  });

  it('styles ignore button with transparent background and auto margin', () => {
    const css = cardContentCSS();
    expect(css).toMatch(/\.harper-ignore\s*\{[^}]*background:\s*transparent/);
    expect(css).toMatch(/\.harper-ignore\s*\{[^}]*margin-left:\s*auto/);
  });
});
