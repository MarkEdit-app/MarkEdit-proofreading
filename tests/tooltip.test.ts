import { describe, expect, it } from 'vitest';
import { tooltipCSS } from '../src/tooltip';

describe('tooltipCSS', () => {
  it('keeps tooltip content padding styles for the inset card layout', () => {
    const css = tooltipCSS;
    expect(css).toContain('.harper-card .harper-content');
    expect(css).toContain('padding: 12px;');
  });
});
