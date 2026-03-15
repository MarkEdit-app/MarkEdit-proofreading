import { describe, expect, it } from 'vitest';
import { tooltipCSS } from '../src/tooltip';

describe('tooltipCSS', () => {
  it('adds an inner wrapper with right padding to protect content from clipping', () => {
    const css = tooltipCSS();
    expect(css).toContain('.harper-card .harper-inner');
    expect(css).toMatch(/\.harper-card\s+\.harper-inner\s*\{[^}]*padding-right:\s*10px/);
  });
});
