import { EditorView } from '@codemirror/view';

// Harper lint kind → color, from packages/lint-framework/src/lint/lintKindColor.ts
export const kindColors: Record<string, string> = {
  Agreement: '#228B22',
  BoundaryError: '#8B4513',
  Capitalization: '#540D6E',
  Eggcorn: '#FF8C00',
  Enhancement: '#0EAD69',
  Formatting: '#7D3C98',
  Grammar: '#9B59B6',
  Malapropism: '#C71585',
  Miscellaneous: '#2B9E86',
  Nonstandard: '#008B8B',
  Punctuation: '#D4850F',
  Readability: '#2E8B57',
  Redundancy: '#4682B4',
  Regionalism: '#A855B5',
  Repetition: '#00A67C',
  Spelling: '#EE4266',
  Style: '#C49000',
  Typo: '#FF6B35',
  Usage: '#1E90FF',
  WordChoice: '#228B22',
};

// Brighter variants for dark backgrounds
export const kindColorsDark: Record<string, string> = {
  Agreement: '#6AEE9A',
  BoundaryError: '#E8B08A',
  Capitalization: '#CCA0EA',
  Eggcorn: '#FFC870',
  Enhancement: '#5EEAB5',
  Formatting: '#D9B8EA',
  Grammar: '#D4A0FF',
  Malapropism: '#FF8CCE',
  Miscellaneous: '#7AECD6',
  Nonstandard: '#50E8D8',
  Punctuation: '#FFBE50',
  Readability: '#6CD8A0',
  Redundancy: '#98CCE8',
  Regionalism: '#E8B8F0',
  Repetition: '#5EEAB5',
  Spelling: '#FF8DA6',
  Style: '#FFE070',
  Typo: '#FFB088',
  Usage: '#80C8FF',
  WordChoice: '#6AEE9A',
};

export const fallback = '#6c757d';
export const fallbackDark = '#B8C0CC';

export function kindCSS(): string {
  let css = '';

  // Default: lighter underline, subtle bg
  css += `.cm-harper-lint { text-decoration: underline solid ${fallback}aa 2px; background-color: ${fallback}11; }\n`;
  css += `.cm-harper-lint:hover { text-decoration-color: ${fallback}; background-color: ${fallback}22; }\n`;
  css += `.cm-harper-lint:active { background-color: ${fallback}33; }\n`;
  css += `.harper-badge { color: ${fallback}; background-color: ${fallback}22; }\n`;

  for (const [kind, color] of Object.entries(kindColors)) {
    css += `.cm-harper-lint[data-lint-kind="${kind}"] { text-decoration: underline solid ${color}aa 2px; background-color: ${color}11; }\n`;
    css += `.cm-harper-lint[data-lint-kind="${kind}"]:hover { text-decoration-color: ${color}; background-color: ${color}22; }\n`;
    css += `.cm-harper-lint[data-lint-kind="${kind}"]:active { background-color: ${color}33; }\n`;
    css += `.harper-badge[data-kind="${kind}"] { color: ${color}; background-color: ${color}22; }\n`;
  }

  css += '@media (prefers-color-scheme: dark) {\n';
  css += `  .cm-harper-lint { text-decoration: underline solid ${fallbackDark}aa 2px; background-color: ${fallbackDark}11; }\n`;
  css += `  .cm-harper-lint:hover { text-decoration-color: ${fallbackDark}; background-color: ${fallbackDark}22; }\n`;
  css += `  .cm-harper-lint:active { background-color: ${fallbackDark}33; }\n`;
  css += `  .harper-badge { color: ${fallbackDark}; background-color: ${fallbackDark}22; }\n`;
  for (const kind of Object.keys(kindColors)) {
    const dark = kindColorsDark[kind] ?? kindColors[kind];
    css += `  .cm-harper-lint[data-lint-kind="${kind}"] { text-decoration: underline solid ${dark}aa 2px; background-color: ${dark}11; }\n`;
    css += `  .cm-harper-lint[data-lint-kind="${kind}"]:hover { text-decoration-color: ${dark}; background-color: ${dark}22; }\n`;
    css += `  .cm-harper-lint[data-lint-kind="${kind}"]:active { background-color: ${dark}33; }\n`;
    css += `  .harper-badge[data-kind="${kind}"] { color: ${dark}; background-color: ${dark}22; }\n`;
  }
  css += '}\n';

  return css;
}

export const baseTheme = EditorView.baseTheme({
  '.cm-harper-lint': {
    cursor: 'default',
    borderRadius: '2px',
    textUnderlineOffset: '3px',
    transition: 'text-decoration-color 0.15s, background-color 0.15s',
  },
});

/** Inject a `<style>` element once, keyed by `id`. No-op if already present. */
export function injectStyleSheet(id: string, css: string): void {
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
}
