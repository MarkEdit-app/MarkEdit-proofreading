import { describe, expect, it } from 'vitest';
import { tooltipCSS } from '../src/tooltip';

describe('tooltipCSS', () => {
  it('adds an outer wrapper with right padding to inset the full card from the right edge', () => {
    const css = tooltipCSS;
    expect(css).toContain('.harper-tooltip-wrap');
    expect(css).toContain('padding-right: 10px;');
    expect(css).toContain('.harper-card .harper-content');
    expect(css).toContain('padding: 12px;');
  });
});
