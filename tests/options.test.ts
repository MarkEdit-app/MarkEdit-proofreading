import { describe, expect, it } from 'vitest';
import { disabledLintKindsFor, getProofreadingSettings } from '../src/settings';

describe('proofreading settings', () => {
  it('uses standard defaults when no settings are provided', () => {
    const settings = getProofreadingSettings(undefined);
    const disabledKinds = disabledLintKindsFor(settings.lintPreset);

    expect(settings.lintPreset).toBe('standard');
    expect(settings.lintRules).toEqual({});
    expect([...disabledKinds]).toEqual(['Enhancement', 'Style', 'WordChoice']);
  });

  it('parses lint preset, per-rule overrides from user settings', () => {
    const settings = getProofreadingSettings({
      'extension.markeditProofreading': {
        lintPreset: 'strict',
        lintRules: {
          SpelledNumbers: true,
          NoOxfordComma: false,
          Keep: null,
          InvalidStringValue: 'yes',
        },
      },
    });
    const disabledKinds = disabledLintKindsFor(settings.lintPreset);

    expect(settings.lintPreset).toBe('strict');
    expect(settings.lintRules).toEqual({
      SpelledNumbers: true,
      NoOxfordComma: false,
      Keep: null,
    });
    expect([...disabledKinds]).toEqual([]);
  });

  it('provides three severity presets', () => {
    expect([...disabledLintKindsFor('strict')]).toEqual([]);
    expect([...disabledLintKindsFor('standard')]).toEqual(['Enhancement', 'Style', 'WordChoice']);
    expect([...disabledLintKindsFor('relaxed')]).toEqual(['Enhancement', 'Readability', 'Redundancy', 'Repetition', 'Style', 'WordChoice']);
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
