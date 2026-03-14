import { describe, expect, it } from 'vitest';
import { getProofreadingSettings } from '../src/settings';
import { presetDisabledRules } from '../src/rules';
import { presetDisabledKinds } from '../src/kinds';

describe('proofreading settings', () => {
  it('uses standard defaults when no settings are provided', () => {
    const settings = getProofreadingSettings(undefined);

    expect(settings.lintPreset).toBe('standard');
    expect(settings.lintRuleOverrides).toEqual({});
    expect(settings.disabledLintKinds).toEqual([]);
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
        disabledLintKinds: ['Regionalism', 'Enhancement'],
      },
    });

    expect(settings.lintPreset).toBe('strict');
    expect(settings.lintRuleOverrides).toEqual({
      SpelledNumbers: true,
      NoOxfordComma: false,
      Keep: null,
    });
    expect(settings.disabledLintKinds).toEqual(['Regionalism', 'Enhancement']);
  });

  it('filters non-string values from disabledLintKinds', () => {
    const settings = getProofreadingSettings({
      'extension.markeditProofreading': {
        disabledLintKinds: ['Enhancement', 42, true, 'Style'],
      },
    });

    expect(settings.disabledLintKinds).toEqual(['Enhancement', 'Style']);
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

  it('provides matching disabled kinds for each preset', () => {
    const strict = presetDisabledKinds('strict');
    const standard = presetDisabledKinds('standard');
    const relaxed = presetDisabledKinds('relaxed');

    expect(strict.size).toBe(0);
    expect(standard).toEqual(new Set(['Enhancement', 'Style', 'WordChoice']));
    expect(relaxed).toEqual(new Set(['Enhancement', 'Style', 'WordChoice', 'Readability', 'Redundancy', 'Repetition']));

    // relaxed includes all standard kinds
    for (const kind of standard) {
      expect(relaxed.has(kind)).toBe(true);
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
