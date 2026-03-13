import { describe, expect, it } from 'vitest';
import { conservativeDisabledLintKinds, disabledLintKindsFor, getProofreadingSettings } from '../src/settings';

describe('proofreading options', () => {
  it('uses conservative defaults when no settings are provided', () => {
    const settings = getProofreadingSettings(undefined);
    const disabledKinds = disabledLintKindsFor(settings);

    expect(settings.lintProfile).toBe('conservative');
    expect(settings.lintRules).toEqual({});
    expect([...disabledKinds]).toEqual([...conservativeDisabledLintKinds]);
  });

  it('parses lint profile, per-rule overrides, and disabled kinds from user settings', () => {
    const settings = getProofreadingSettings({
      'extension.markeditProofreading': {
        lintProfile: 'all',
        lintRules: {
          SpelledNumbers: true,
          NoOxfordComma: false,
          Keep: null,
          InvalidStringValue: 'yes',
        },
        disabledLintKinds: ['Usage', 'Grammar', 123],
      },
    });
    const disabledKinds = disabledLintKindsFor(settings);

    expect(settings.lintProfile).toBe('all');
    expect(settings.lintRules).toEqual({
      SpelledNumbers: true,
      NoOxfordComma: false,
      Keep: null,
    });
    expect([...disabledKinds]).toEqual(['Usage', 'Grammar']);
  });
});
