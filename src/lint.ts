import { LocalLinter, binaryInlined } from 'harper.js';
import type { Lint } from 'harper.js';

const linter = new LocalLinter({
  binary: binaryInlined,
});

export type Diagnostic = {
  from: number;
  to: number;
  message: string;
  lint: Lint;
};

export async function lint(text: string): Promise<Diagnostic[]> {
  const results = await linter.lint(text, { language: 'markdown' });
  return results.map(result => {
    const span = result.span();
    return {
      from: span.start,
      to: span.end,
      message: result.message(),
      lint: result,
    };
  });
}
