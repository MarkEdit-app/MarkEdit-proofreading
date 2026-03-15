import { describe, expect, it } from 'vitest';
import { presetDisabledRules } from '../src/rules';

describe('presetDisabledRules', () => {
  it('strict disables no rules', () => {
    expect(presetDisabledRules('strict')).toEqual([]);
  });

  it('standard disables a non-empty list of rules', () => {
    const rules = presetDisabledRules('standard');
    expect(rules.length).toBeGreaterThan(0);
  });

  it('relaxed includes every standard rule', () => {
    const standard = presetDisabledRules('standard');
    const relaxed = presetDisabledRules('relaxed');

    for (const rule of standard) {
      expect(relaxed).toContain(rule);
    }
  });

  it('relaxed disables more rules than standard', () => {
    const standard = presetDisabledRules('standard');
    const relaxed = presetDisabledRules('relaxed');
    expect(relaxed.length).toBeGreaterThan(standard.length);
  });

  it('contains no duplicate rule names within each preset', () => {
    for (const preset of ['standard', 'relaxed'] as const) {
      const rules = presetDisabledRules(preset);
      const unique = new Set(rules);
      expect(unique.size).toBe(rules.length);
    }
  });
});
