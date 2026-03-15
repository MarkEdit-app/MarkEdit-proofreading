import { describe, expect, it } from 'vitest';
import { presetDisabledKinds } from '../src/kinds';

describe('presetDisabledKinds', () => {
  it('strict disables no kinds', () => {
    expect(presetDisabledKinds('strict').size).toBe(0);
  });

  it('standard disables Enhancement, Style, and WordChoice', () => {
    const kinds = presetDisabledKinds('standard');
    expect(kinds).toEqual(new Set(['Enhancement', 'Style', 'WordChoice']));
  });

  it('relaxed includes every standard kind', () => {
    const standard = presetDisabledKinds('standard');
    const relaxed = presetDisabledKinds('relaxed');

    for (const kind of standard) {
      expect(relaxed.has(kind)).toBe(true);
    }
  });

  it('relaxed disables more kinds than standard', () => {
    const standard = presetDisabledKinds('standard');
    const relaxed = presetDisabledKinds('relaxed');
    expect(relaxed.size).toBeGreaterThan(standard.size);
  });
});
