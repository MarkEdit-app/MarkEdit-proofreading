import { LocalLinter, binaryInlined } from 'harper.js';

const linter = new LocalLinter({ binary: binaryInlined });

export async function lint(text: string) {
  return await linter.lint(text);
}
