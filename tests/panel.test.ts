import { describe, expect, it } from 'vitest';
import { paneCSS } from '../src/panel';
import { cardContentCSS } from '../src/card';

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

  it('includes title wrap and total count styles', () => {
    const css = paneCSS();
    expect(css).toContain('.harper-pane-title-wrap');
    expect(css).toContain('.harper-pane-total');
  });

  it('styles cards with border and shadow', () => {
    const css = paneCSS();
    expect(css).toMatch(/\.harper-pane-item\s*\{[^}]*border:\s*1px solid/);
    expect(css).toMatch(/\.harper-pane-item\s*\{[^}]*box-shadow:/);
    expect(css).toMatch(/\.harper-pane-item\s*\{[^}]*margin:\s*8px/);
  });

  it('styles section heading without border-left', () => {
    const css = paneCSS();
    expect(css).toContain('.harper-pane-section-heading');
    // Should NOT have a border-left on section heading
    expect(css).not.toMatch(/\.harper-pane-section-heading\s*\{[^}]*border-left:/);
  });

  it('uses larger badge size', () => {
    const css = paneCSS();
    expect(css).toMatch(/\.harper-pane-section-heading\s+\.harper-badge\s*\{[^}]*font-size:\s*12px/);
    expect(css).toMatch(/\.harper-pane-section-heading\s+\.harper-badge\s*\{[^}]*padding:\s*3px\s+8px/);
  });

  it('overrides shared code element sizes for pane context', () => {
    const css = paneCSS();
    expect(css).toMatch(/\.harper-pane-item\s+\.harper-msg\s+code\s*\{[^}]*font-size:\s*11px/);
    expect(css).toMatch(/\.harper-pane-item\s+\.harper-msg\s+code\s*\{[^}]*padding:\s*1px\s+5px/);
  });

  it('includes slide animation styles', () => {
    const css = paneCSS();
    expect(css).toMatch(/\.harper-pane\s*\{[^}]*transform:\s*translateX\(100%\)/);
    expect(css).toMatch(/\.harper-pane\s*\{[^}]*transition:/);
    expect(css).toContain('.harper-pane-visible');
    expect(css).toContain('translateX(0)');
  });

  it('includes card dismiss animation styles', () => {
    const css = paneCSS();
    expect(css).toContain('.harper-pane-item-dismissing');
    expect(css).toMatch(/\.harper-pane-item-dismissing\s*\{[^}]*opacity:\s*0/);
    expect(css).toMatch(/\.harper-pane-item-dismissing\s*\{[^}]*max-height:\s*0/);
    expect(css).toMatch(/\.harper-pane-item-dismissing\s*\{[^}]*transition:/);
  });

  it('includes dark mode overrides', () => {
    const css = paneCSS();
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('.harper-pane-title { color: #f0f0f0; }');
  });

  it('includes empty state and section styles', () => {
    const css = paneCSS();
    expect(css).toContain('.harper-pane-empty');
    expect(css).toContain('.harper-pane-section');
    expect(css).toContain('.harper-pane-count');
  });
});

describe('cardContentCSS', () => {
  it('includes accent-colored code elements', () => {
    const css = cardContentCSS();
    expect(css).toMatch(/\.harper-msg\s+code\s*\{[^}]*color:\s*var\(--harper-kind-color/);
    expect(css).toMatch(/\.harper-msg\s+code\s*\{[^}]*background:\s*color-mix/);
  });

  it('includes shared button and ignore styles', () => {
    const css = cardContentCSS();
    expect(css).toContain('.harper-btn');
    expect(css).toContain('.harper-ignore');
    expect(css).toContain('.harper-actions');
  });

  it('includes dark mode overrides for shared elements', () => {
    const css = cardContentCSS();
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toMatch(/\.harper-btn\s*\{[^}]*background:\s*#323639/);
    expect(css).toMatch(/\.harper-ignore\s*\{[^}]*border-color:\s*#555/);
  });
});
