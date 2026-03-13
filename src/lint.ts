import { LocalLinter, binaryInlined } from 'harper.js';
import { MarkEdit } from 'markedit-api';
import { disabledLintKindsFor, getProofreadingSettings } from './options';

const linter = new LocalLinter({ binary: binaryInlined });
const settings = getProofreadingSettings(MarkEdit.userSettings);
const disabledLintKinds = disabledLintKindsFor(settings);
const configureLinterPromise = applyLintRules().catch(error => {
  console.warn('[markedit-proofreading] Failed to apply lintRules from settings.json (markedit-proofreading.lintRules).', error);
});

export async function lint(text: string) {
  await configureLinterPromise;
  const lints = await linter.lint(text);
  if (disabledLintKinds.size === 0) {
    return lints;
  }
  return lints.filter(l => !disabledLintKinds.has(l.lint_kind()));
}

async function applyLintRules() {
  if (Object.keys(settings.lintRules).length === 0) {
    return;
  }

  const config = await linter.getDefaultLintConfig();
  await linter.setLintConfig({ ...config, ...settings.lintRules });
}
