import { LocalLinter, binaryInlined, type LintConfig } from 'harper.js';
import { MarkEdit } from 'markedit-api';
import { getProofreadingSettings, presetDisabledKinds } from './settings';

const linter = new LocalLinter({ binary: binaryInlined });
const settings = getProofreadingSettings(MarkEdit.userSettings);
const configureLinterPromise = configureLinter().catch(error => {
  console.warn('[markedit-proofreading] Failed to configure linter.', error);
});

export async function lint(text: string) {
  await configureLinterPromise;

  return linter.lint(text);
}

// Sample text designed to trigger rules from noisy lint kinds so we can discover and disable them.
// Each line targets specific categories; this runs once at init and doesn't need to be exhaustive
// since rules not triggered here keep their Harper defaults.
const sampleText = [
  'This sentence is very good and I am very hungry.',
  'It was very cold outside despite of all odds.',
  'He could of done better at the ATM machine.',
  'The the quick brown fox jumped over the lazy dog.',
  'Basically, I think perhaps we should avoid filler words.',
  'However, the fact of the matter is sort of clear.',
  'This kind of approach is a couple of more items needed.',
  'This is a very unique approach to the roadmap for all intensive purposes.',
  'First and foremost, each and every person should try and do their best.',
  'This extremely long sentence just goes on and on with many words to hit the readability threshold for long sentences which are flagged by the linter as being too long for comfortable reading by the average reader who might encounter this text in the wild today.',
].join(' ');

async function configureLinter() {
  const defaults = await linter.getDefaultLintConfig();
  const disabledKinds = presetDisabledKinds[settings.lintPreset];

  if (disabledKinds.length === 0 && Object.keys(settings.lintRules).length === 0) {
    return;
  }

  const config: LintConfig = { ...defaults };

  if (disabledKinds.length > 0) {
    // Enable all rules temporarily to discover their lint kinds
    const allEnabled: LintConfig = {};
    for (const name of Object.keys(defaults)) {
      allEnabled[name] = true;
    }

    await linter.setLintConfig(allEnabled);

    // Use organizedLints to map rule names to their lint kinds
    const organized = await linter.organizedLints(sampleText);
    const kindsSet = new Set(disabledKinds);

    for (const [ruleName, lints] of Object.entries(organized)) {
      if (lints.some(l => kindsSet.has(l.lint_kind()))) {
        config[ruleName] = false;
      }
    }
  }

  // Apply user rule overrides on top
  for (const [name, val] of Object.entries(settings.lintRules)) {
    config[name] = val;
  }

  await linter.setLintConfig(config);
}
