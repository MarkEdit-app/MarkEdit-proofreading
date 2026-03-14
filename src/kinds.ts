import type { LintPreset } from './settings';

// Lint kinds disabled per preset, used as a safety net to catch rules not in static lists.
const standardDisabledKinds: readonly string[] = ['Enhancement', 'Style', 'WordChoice'];
const relaxedDisabledKinds: readonly string[] = [...standardDisabledKinds, 'Readability', 'Redundancy', 'Repetition'];

export function presetDisabledKinds(preset: LintPreset): ReadonlySet<string> {
  switch (preset) {
    case 'strict':
      return new Set();
    case 'standard':
      return new Set(standardDisabledKinds);
    case 'relaxed':
      return new Set(relaxedDisabledKinds);
  }
}
