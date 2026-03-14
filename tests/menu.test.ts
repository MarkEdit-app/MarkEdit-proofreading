import { describe, expect, it } from 'vitest';
import { buildMenuItem } from '../src/menu';

describe('buildMenuItem', () => {
  it('returns the expected menu structure', () => {
    const item = buildMenuItem();

    expect(item.title).toBe('Proofread');
    expect(item.icon).toBe('text.badge.checkmark');

    const children = item.children!;
    expect(children).toHaveLength(5);

    expect(children[0].title).toBe('Proofread Now');
    expect(typeof children[0].action).toBe('function');

    expect(children[1].title).toBe('Ignore All');
    expect(typeof children[1].action).toBe('function');

    expect(children[2].separator).toBe(true);

    expect(children[3].title).toMatch(/^Version \S+/);
    expect(typeof children[3].action).toBe('function');

    expect(children[4].title).toBe('Check Release (GitHub)');
    expect(typeof children[4].action).toBe('function');
  });
});
