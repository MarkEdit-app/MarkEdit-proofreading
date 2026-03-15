import { describe, expect, it } from 'vitest';
import { paneCSS } from '../src/panel';

describe('paneCSS', () => {
  it('includes core pane class rules', () => {
    const css = paneCSS();
    expect(css).toContain('.harper-pane {');
    expect(css).toContain('.harper-pane-header');
    expect(css).toContain('.harper-pane-body');
    expect(css).toContain('.harper-pane-item');
    expect(css).toContain('.harper-pane-close');
    expect(css).toContain('.harper-pane-action');
  });

  it('positions the pane as a right sidebar', () => {
    const css = paneCSS();
    expect(css).toContain('position: absolute');
    expect(css).toContain('right: 0');
    expect(css).toContain('top: 0');
    expect(css).toContain('bottom: 0');
  });

  it('makes the body scrollable', () => {
    const css = paneCSS();
    expect(css).toContain('.harper-pane-body');
    expect(css).toContain('overflow-y: auto');
    expect(css).toContain('min-height: 0');
  });

  it('applies accent color to section heading', () => {
    const css = paneCSS();
    expect(css).toContain('.harper-pane-section-heading');
    expect(css).toMatch(/\.harper-pane-section-heading\s*\{[^}]*border-left:/);
  });

  it('adds border and spacing to cards', () => {
    const css = paneCSS();
    expect(css).toMatch(/\.harper-pane-item\s*\{[^}]*border:\s*1px solid/);
    expect(css).toMatch(/\.harper-pane-item\s*\{[^}]*margin:\s*6px/);
  });

  it('includes dark mode overrides', () => {
    const css = paneCSS();
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('.harper-pane-title { color: #ddd; }');
  });

  it('includes empty state and section styles', () => {
    const css = paneCSS();
    expect(css).toContain('.harper-pane-empty');
    expect(css).toContain('.harper-pane-section');
    expect(css).toContain('.harper-pane-count');
  });
});
