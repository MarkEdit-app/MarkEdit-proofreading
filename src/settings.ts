import type { LintConfig } from 'harper.js';
import type { MarkEdit } from 'markedit-api';

const settingsKey = 'extension.markeditProofreading';

export type LintPreset = 'strict' | 'standard' | 'relaxed';

// Dialects supported by Harper. Kept as strings here so this module stays free of any
// harper.js (WebAssembly) import; lint.ts maps these names to the harper.js `Dialect` enum.
export type DialectName = 'American' | 'British' | 'Australian' | 'Canadian' | 'Indian';

const dialectNames: readonly DialectName[] = ['American', 'British', 'Australian', 'Canadian', 'Indian'];

type JSONObject = MarkEdit['userSettings'];
type JSONValue = JSONObject[string];

export interface ProofreadingSettings {
  autoLintDelay: number;
  lintPreset: LintPreset;
  lintRuleOverrides: LintConfig;
  disabledLintKinds: string[];
  addToDict: boolean;
  dialect: DialectName;
  dialectFallbacks: DialectName[];
}

export function getProofreadingSettings(userSettings: JSONObject | undefined): ProofreadingSettings {
  const defaults: ProofreadingSettings = {
    autoLintDelay: 1000,
    lintPreset: 'strict',
    lintRuleOverrides: {},
    disabledLintKinds: [],
    addToDict: true,
    dialect: 'American',
    dialectFallbacks: [],
  };

  const root = asObject(userSettings);
  const raw = asObject(root?.[settingsKey]);
  if (!raw) {
    return defaults;
  }

  const lintPreset = parseLintPreset(raw.lintPreset);
  const autoLintDelay = parseAutoLintDelay(raw.autoLintDelay);

  const lintRuleOverrides = Object.fromEntries(
    Object.entries(asObject(raw.lintRuleOverrides) ?? {}).filter(([, value]) => isLintRuleValue(value)),
  ) as LintConfig;

  const disabledLintKinds = parseStringArray(raw.disabledLintKinds);
  const addToDict = raw.addToDict !== false;
  const dialect = parseDialect(raw.dialect);
  const dialectFallbacks = parseDialectList(raw.dialectFallbacks, dialect);

  return { autoLintDelay, lintPreset, lintRuleOverrides, disabledLintKinds, addToDict, dialect, dialectFallbacks };
}

function parseLintPreset(value: JSONValue): LintPreset {
  if (value === 'strict' || value === 'standard' || value === 'relaxed') {
    return value;
  }

  return 'strict';
}

function parseAutoLintDelay(value: JSONValue): number {
  if (typeof value === 'number' && (value === -1 || value > 0)) {
    return value;
  }

  return 1000;
}

function parseDialect(value: JSONValue): DialectName {
  return isDialectName(value) ? value : 'American';
}

// Parses fallback dialects, dropping invalid names, duplicates, and the primary dialect
// (a fallback to the primary itself would be a no-op).
function parseDialectList(value: JSONValue, primary: DialectName): DialectName[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const fallbacks = new Set<DialectName>();
  for (const item of value) {
    if (isDialectName(item) && item !== primary) {
      fallbacks.add(item);
    }
  }

  return [...fallbacks];
}

function isDialectName(value: JSONValue): value is DialectName {
  return typeof value === 'string' && (dialectNames as readonly string[]).includes(value);
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
