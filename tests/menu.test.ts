import { describe, expect, it } from 'vitest';
import { buildMenuItems } from '../src/menu';

describe('buildMenuItems', () => {
  it('returns the expected menu structure', () => {
    const items = buildMenuItems();

    expect(items).toHaveLength(5);

    expect(items[0].title).toBe('Proofread Now');
    expect(typeof items[0].action).toBe('function');

    expect(items[1].title).toBe('Ignore All');
    expect(typeof items[1].action).toBe('function');

    expect(items[2].separator).toBe(true);

    expect(items[3].title).toMatch(/^Version \S+/);
    expect(typeof items[3].action).toBe('function');

    expect(items[4].title).toBe('Check Release (GitHub)');
    expect(typeof items[4].action).toBe('function');
  });
});
