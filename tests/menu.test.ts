import { describe, expect, it } from 'vitest';
import { buildMenuItem } from '../src/menu';

describe('buildMenuItem', () => {
  it('returns the expected menu structure', () => {
    const item = buildMenuItem();

    expect(item.title).toBe('Proofread');
    expect(item.icon).toBe('text.badge.checkmark');

    const children = item.children!;
    expect(children).toHaveLength(6);

    expect(children[0].title).toBe('Proofread Now');
    expect(typeof children[0].action).toBe('function');

    expect(children[1].title).toBe('Ignore All');
    expect(typeof children[1].action).toBe('function');

    expect(children[2].title).toBe('Reset Dictionary');
    expect(typeof children[2].action).toBe('function');

    expect(children[3].separator).toBe(true);

    expect(children[4].title).toMatch(/^Version \S+/);
    expect(typeof children[4].action).toBe('function');

    expect(children[5].title).toBe('Check Releases (GitHub)');
    expect(typeof children[5].action).toBe('function');
  });
});
