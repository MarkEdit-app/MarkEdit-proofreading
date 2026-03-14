import type { LintConfig } from 'harper.js';
import type { MarkEdit } from 'markedit-api';

const settingsKey = 'extension.markeditProofreading';

export type LintPreset = 'strict' | 'standard' | 'relaxed';

// Rules disabled in the "standard" preset (Enhancement, Style, WordChoice).
// Rule names from https://writewithharper.com/docs/rules
const standardDisabledRules: readonly string[] = [
  // Enhancement
  'BoringWords', 'Excellent', 'Freezing', 'Starving',
  // Style
  'AOkHyphen', 'Addicting', 'AdjectiveOfA', 'ArriveOnWeekday', 'ClickThroughRate', 'Cybersec',
  'ExpandAlloc', 'ExpandArgument', 'ExpandBecause', 'ExpandControl', 'ExpandDecl',
  'ExpandDependencies', 'ExpandDeref', 'ExpandForward', 'ExpandMemoryShorthands',
  'ExpandMinimum', 'ExpandParameter', 'ExpandPointer', 'ExpandPrevious',
  'ExpandStandardInputAndOutput', 'ExpandThrough', 'ExpandTimeShorthands',
  'ExpandWith', 'ExpandWithout',
  'FatalOutcome', 'MoreAdjective', 'PasswordProtectedHyphen', 'RainbowColoredHyphen',
  'SendAnEmailTo', 'SomewhatSomething', 'TrueToWord', 'WordPressDotcom', 'WouldNeverHave',
  // WordChoice
  'Alongside', 'AsFarBackAs', 'AsOfCurrently', 'AsOfLately', 'AtFaceValue',
  'AtTheEndOfTheDay', 'Brutality', 'DespiteOf', 'Insensitive', 'Insurmountable',
  'LastNight', 'ModalOf', 'RoadMap', 'TongueInCheek', 'VeryUnique', 'WaveFunction',
];

// All rules disabled in the "relaxed" preset (standard + Readability, Redundancy, Repetition).
const relaxedDisabledRules: readonly string[] = [
  ...standardDisabledRules,
  // Readability
  'LongSentences',
  // Redundancy
  'ACoupleMore', 'AnAnother', 'AnotherAn', 'AsIfThough', 'AvoidAndAlso',
  'CondenseAllThe', 'KindOf', 'MissingDeterminer', 'RedundantAcronyms',
  'RedundantAdditiveAdverbs', 'RedundantIIRC', 'RedundantPretty',
  'RedundantSuperlatives', 'RedundantThat', 'TickingTimeClock', 'Towards',
  // Repetition
  'RepeatedWords',
];

export function presetDisabledRules(preset: LintPreset): readonly string[] {
  switch (preset) {
    case 'strict':
      return [];
    case 'standard':
      return standardDisabledRules;
    case 'relaxed':
      return relaxedDisabledRules;
  }
}

type JSONObject = MarkEdit['userSettings'];
type JSONValue = JSONObject[string];

export interface ProofreadingSettings {
  lintPreset: LintPreset;
  lintRules: LintConfig;
}

export function getProofreadingSettings(userSettings: JSONObject | undefined): ProofreadingSettings {
  const defaults: ProofreadingSettings = {
    lintPreset: 'standard',
    lintRules: {},
  };

  const root = asObject(userSettings);
  const raw = asObject(root?.[settingsKey]);
  if (!raw) {
    return defaults;
  }

  const lintPreset = parseLintPreset(raw.lintPreset);

  const lintRules = Object.fromEntries(
    Object.entries(asObject(raw.lintRules) ?? {}).filter(([, value]) => isLintRuleValue(value)),
  ) as LintConfig;

  return { lintPreset, lintRules };
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
