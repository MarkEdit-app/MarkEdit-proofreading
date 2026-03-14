import type { LintPreset } from './settings';

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
