import { describe, expect, it } from 'vitest';
import { panelCSS } from '../src/panel';

describe('panelCSS', () => {
  it('includes core panel class rules', () => {
    const css = panelCSS();
    expect(css).toContain('.harper-panel {');
    expect(css).toContain('.harper-panel-header');
    expect(css).toContain('.harper-panel-body');
    expect(css).toContain('.harper-panel-item');
    expect(css).toContain('.harper-panel-close');
    expect(css).toContain('.harper-panel-action');
  });

  it('includes dark mode overrides', () => {
    const css = panelCSS();
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain('.harper-panel-title { color: #ddd; }');
  });

  it('includes empty state and section styles', () => {
    const css = panelCSS();
    expect(css).toContain('.harper-panel-empty');
    expect(css).toContain('.harper-panel-section');
    expect(css).toContain('.harper-panel-count');
  });
});
