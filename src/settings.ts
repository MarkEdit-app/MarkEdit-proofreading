import type { LintConfig } from 'harper.js';
import type { MarkEdit } from 'markedit-api';

const settingsKey = 'extension.markeditProofreading';

export type LintPreset = 'strict' | 'standard' | 'relaxed';

type JSONObject = MarkEdit['userSettings'];
type JSONValue = JSONObject[string];

export interface ProofreadingSettings {
  lintPreset: LintPreset;
  lintRuleOverrides: LintConfig;
  disabledLintKinds: string[];
}

export function getProofreadingSettings(userSettings: JSONObject | undefined): ProofreadingSettings {
  const defaults: ProofreadingSettings = {
    lintPreset: 'standard',
    lintRuleOverrides: {},
    disabledLintKinds: [],
  };

  const root = asObject(userSettings);
  const raw = asObject(root?.[settingsKey]);
  if (!raw) {
    return defaults;
  }

  const lintPreset = parseLintPreset(raw.lintPreset);

  const lintRuleOverrides = Object.fromEntries(
    Object.entries(asObject(raw.lintRuleOverrides) ?? {}).filter(([, value]) => isLintRuleValue(value)),
  ) as LintConfig;

  const disabledLintKinds = parseStringArray(raw.disabledLintKinds);

  return { lintPreset, lintRuleOverrides, disabledLintKinds };
}

function parseLintPreset(value: JSONValue): LintPreset {
  if (value === 'strict' || value === 'standard' || value === 'relaxed') {
    return value;
  }

  return 'standard';
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

function parseStringArray(value: JSONValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}
