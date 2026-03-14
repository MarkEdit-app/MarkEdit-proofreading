import { describe, expect, it } from 'vitest';
import { getProofreadingSettings, presetDisabledKinds } from '../src/settings';

describe('proofreading settings', () => {
  it('uses standard defaults when no settings are provided', () => {
    const settings = getProofreadingSettings(undefined);

    expect(settings.lintPreset).toBe('standard');
    expect(settings.lintRules).toEqual({});
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

    expect(settings.lintPreset).toBe('strict');
    expect(settings.lintRules).toEqual({
      SpelledNumbers: true,
      NoOxfordComma: false,
      Keep: null,
    });
  });

  it('defines disabled lint kinds for three presets', () => {
    expect(presetDisabledKinds.strict).toEqual([]);
    expect(presetDisabledKinds.standard).toEqual(['Enhancement', 'Style', 'WordChoice']);
    expect(presetDisabledKinds.relaxed).toEqual(['Enhancement', 'Readability', 'Redundancy', 'Repetition', 'Style', 'WordChoice']);
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
