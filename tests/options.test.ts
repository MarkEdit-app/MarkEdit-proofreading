import { describe, expect, it } from 'vitest';
import { getProofreadingSettings } from '../src/settings';
import { presetDisabledRules } from '../src/rules';

describe('proofreading settings', () => {
  it('uses standard defaults when no settings are provided', () => {
    const settings = getProofreadingSettings(undefined);

    expect(settings.lintPreset).toBe('standard');
    expect(settings.lintRuleOverrides).toEqual({});
  });

  it('parses lint preset, per-rule overrides from user settings', () => {
    const settings = getProofreadingSettings({
      'extension.markeditProofreading': {
        lintPreset: 'strict',
        lintRuleOverrides: {
          SpelledNumbers: true,
          NoOxfordComma: false,
          Keep: null,
          InvalidStringValue: 'yes',
        },
      },
    });

    expect(settings.lintPreset).toBe('strict');
    expect(settings.lintRuleOverrides).toEqual({
      SpelledNumbers: true,
      NoOxfordComma: false,
      Keep: null,
    });
  });

  it('provides three presets with increasing disabled rule counts', () => {
    const strict = presetDisabledRules('strict');
    const standard = presetDisabledRules('standard');
    const relaxed = presetDisabledRules('relaxed');

    expect(strict).toEqual([]);
    expect(standard.length).toBeGreaterThan(0);
    expect(relaxed.length).toBeGreaterThan(standard.length);

    // relaxed includes all standard rules plus more
    for (const rule of standard) {
      expect(relaxed).toContain(rule);
    }
  });

  it('falls back to standard for unrecognized preset values', () => {
    const settings = getProofreadingSettings({
      'extension.markeditProofreading': {
        lintPreset: 'unknown',
      },
    });

    expect(settings.lintPreset).toBe('standard');
  });
});
