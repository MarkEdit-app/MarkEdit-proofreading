import { LocalLinter, binaryInlined, type LintConfig } from 'harper.js';
import { MarkEdit } from 'markedit-api';
import { getProofreadingSettings } from './settings';
import { presetDisabledRules } from './rules';

const linter = new LocalLinter({ binary: binaryInlined });
const settings = getProofreadingSettings(MarkEdit.userSettings);
const configureLinterPromise = configureLinter().catch(error => {
  console.warn('[markedit-proofreading] Failed to configure linter.', error);
});

export async function lint(text: string) {
  await configureLinterPromise;

  return linter.lint(text);
}

async function configureLinter() {
  const disabledRules = presetDisabledRules(settings.lintPreset);

  if (disabledRules.length === 0 && Object.keys(settings.lintRuleOverrides).length === 0) {
    return;
  }

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
