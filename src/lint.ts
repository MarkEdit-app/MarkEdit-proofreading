import { LocalLinter, binaryInlined } from 'harper.js';

const linter = new LocalLinter({
  binary: binaryInlined,
});

linter.lint('Helllo, is this something you want?').then(results => {
  for (const result of results) {
    console.log(result.suggestions());
  }
});

export async function lint(text: string) {
  return await linter.lint(text);
}
