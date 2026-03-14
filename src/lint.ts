import { LocalLinter, binaryInlined, type LintConfig } from 'harper.js';
import { MarkEdit } from 'markedit-api';
import { getProofreadingSettings } from './settings';
import { presetDisabledRules } from './rules';
import { presetDisabledKinds } from './kinds';
import { loadWords, saveWords } from './dict';

const linter = new LocalLinter({ binary: binaryInlined });
const settings = getProofreadingSettings(MarkEdit.userSettings);
const disabledKinds = resolveDisabledKinds();
const linterReady = configureLinter().catch(error => {
  console.warn('[MarkEdit-proofreading] Failed to configure linter.', error);
});

export const shouldAddToDict = settings.addToDict;

export async function lint(text: string) {
  await linterReady;
  const lints = await linter.lint(text);

  // Post-filter by kind as a safety net for rules not covered by the static lists
  if (disabledKinds.size === 0) {
    return lints;
  }

  return lints.filter(lint => !disabledKinds.has(lint.lint_kind()));
}

export async function addToDictionary(word: string): Promise<void> {
  await linterReady;
  await linter.importWords([word]);

  // Read from disk (not Harper memory) to preserve words added by other editors
  const existing = await loadWords();
  if (!existing.includes(word)) {
    existing.push(word);
    await saveWords(existing);
  }
}

function resolveDisabledKinds(): ReadonlySet<string> {
  const fromPreset = presetDisabledKinds(settings.lintPreset);
  if (settings.disabledLintKinds.length === 0) {
    return fromPreset;
  }

  return new Set([...fromPreset, ...settings.disabledLintKinds]);
}

async function configureLinter() {
  const disabledRules = presetDisabledRules(settings.lintPreset);
  const hasRuleConfig =
    disabledRules.length > 0 ||
    Object.keys(settings.lintRuleOverrides).length > 0;

  if (hasRuleConfig) {
    const config: LintConfig = await linter.getDefaultLintConfig();

    for (const rule of disabledRules) {
      if (rule in config) {
        config[rule] = false;
      }
    }

    // Apply user rule overrides on top
    for (const [name, val] of Object.entries(settings.lintRuleOverrides)) {
      config[name] = val;
    }

    await linter.setLintConfig(config);
  }

  // Load persisted dictionary words (always, even if no rules to configure)
  const words = await loadWords();
  if (words.length > 0) {
    await linter.importWords(words);
  }
}
