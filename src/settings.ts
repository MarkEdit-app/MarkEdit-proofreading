import type { LintConfig } from 'harper.js';
import type { MarkEdit } from 'markedit-api';

const settingsKey = 'extension.markeditProofreading';

export const conservativeDisabledLintKinds = ['Enhancement', 'Readability', 'Repetition', 'Style', 'WordChoice'] as const;

type LintProfile = 'all' | 'conservative';
type JSONObject = MarkEdit['userSettings'];
type JSONValue = JSONObject[string];

export interface ProofreadingSettings {
  lintProfile: LintProfile;
  lintRules: LintConfig;
  disabledLintKinds: string[];
}

export function getProofreadingSettings(userSettings: JSONObject | undefined): ProofreadingSettings {
  const defaults: ProofreadingSettings = {
    lintProfile: 'conservative',
    lintRules: {},
    disabledLintKinds: [],
  };

  const root = asObject(userSettings);
  const raw = asObject(root?.[settingsKey]);
  if (!raw) {
    return defaults;
  }

  const lintProfile: LintProfile = raw.lintProfile === 'all' ? 'all' : 'conservative';

  const lintRules = Object.fromEntries(
    Object.entries(asObject(raw.lintRules) ?? {}).filter(([, value]) => isLintRuleValue(value)),
  ) as LintConfig;

  const disabledLintKinds = Array.isArray(raw.disabledLintKinds)
    ? raw.disabledLintKinds.filter((kind): kind is string => typeof kind === 'string' && kind.length > 0)
    : [];

  return { lintProfile, lintRules, disabledLintKinds };
}

export function disabledLintKindsFor(settings: ProofreadingSettings): Set<string> {
  const disabled = settings.lintProfile === 'all' ? [] : conservativeDisabledLintKinds;
  return new Set([...disabled, ...settings.disabledLintKinds]);
}

function asObject(value: JSONValue | undefined): JSONObject | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as JSONObject;
}

function isLintRuleValue(value: JSONValue): value is boolean | null {
  return typeof value === 'boolean' || value === null;
}
