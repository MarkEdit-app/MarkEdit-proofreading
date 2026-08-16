import { LocalLinter, binary, Dialect, type LintConfig, type Lint } from 'harper.js';
import { MarkEdit } from 'markedit-api';
import { getProofreadingSettings, type DialectName } from './settings';
import { presetDisabledRules } from './rules';
import { presetDisabledKinds } from './kinds';
import { keepSpellingLint, spanKey } from './fallback';
import { loadWords, saveWords } from './dict';

const dialectByName: Record<DialectName, Dialect> = {
  American: Dialect.American,
  British: Dialect.British,
  Australian: Dialect.Australian,
  Canadian: Dialect.Canadian,
  Indian: Dialect.Indian,
};

const linter = new LocalLinter({ binary });
const settings = getProofreadingSettings(MarkEdit.userSettings);
const disabledKinds = resolveDisabledKinds();
// One extra linter per fallback dialect; only used to test whether a word is an accepted
// spelling in that dialect. Created only when fallbacks are configured.
const fallbackLinters = settings.dialectFallbacks.map(() => new LocalLinter({ binary }));
const linterReady = configureLinter().catch(error => {
  console.warn('[MarkEdit-proofreading] Failed to configure linter.', error);
});

export const shouldAddToDict = settings.addToDict;

export async function lint(text: string) {
  await linterReady;
  const lints = await linter.lint(text);

  // Post-filter by kind as a safety net for rules not covered by the static lists
  const kept = disabledKinds.size === 0
    ? lints
    : lints.filter(lint => !disabledKinds.has(lint.lint_kind()));

  if (fallbackLinters.length === 0) {
    return kept;
  }

  return filterByFallbackDialects(text, kept);
}

// Drops Spelling lints for words that are valid in a configured fallback dialect, so a primary
// dialect of e.g. Australian still accepts American spellings while suggesting Australian ones.
async function filterByFallbackDialects(text: string, lints: Lint[]): Promise<Lint[]> {
  const fallbackSpellingSpans = await Promise.all(
    fallbackLinters.map(async fallback => {
      const fallbackLints = await fallback.lint(text);
      return new Set(
        fallbackLints
          .filter(lint => lint.lint_kind() === 'Spelling')
          .map(lint => spanKey(lint.span())),
      );
    }),
  );

  return lints.filter(lint => {
    if (lint.lint_kind() !== 'Spelling') {
      return true;
    }

    return keepSpellingLint(spanKey(lint.span()), fallbackSpellingSpans);
  });
}

export async function resetDictionary(): Promise<void> {
  await linterReady;
  await linter.clearWords();
  await saveWords([]);
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
  await linter.setDialect(dialectByName[settings.dialect]);
  await Promise.all(
    settings.dialectFallbacks.map((name, index) => fallbackLinters[index].setDialect(dialectByName[name])),
  );

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
