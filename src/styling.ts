import { EditorView } from '@codemirror/view';

// Harper lint kind → color, from packages/lint-framework/src/lint/lintKindColor.ts
const kindColors: Record<string, string> = {
  Agreement: '#228B22',
  BoundaryError: '#8B4513',
  Capitalization: '#540D6E',
  Eggcorn: '#FF8C00',
  Enhancement: '#0EAD69',
  Formatting: '#7D3C98',
  Grammar: '#9B59B6',
  Malapropism: '#C71585',
  Miscellaneous: '#3BCEAC',
  Nonstandard: '#008B8B',
  Punctuation: '#D4850F',
  Readability: '#2E8B57',
  Redundancy: '#4682B4',
  Regionalism: '#C061CB',
  Repetition: '#00A67C',
  Spelling: '#EE4266',
  Style: '#FFD23F',
  Typo: '#FF6B35',
  Usage: '#1E90FF',
  WordChoice: '#228B22',
};

// Brighter variants for dark backgrounds
const kindColorsDark: Record<string, string> = {
  Agreement: '#4ADE80',
  BoundaryError: '#D4956C',
  Capitalization: '#B07DD8',
  Eggcorn: '#FFB347',
  Enhancement: '#34D399',
  Formatting: '#C49CDE',
  Grammar: '#C084FC',
  Malapropism: '#F472B6',
  Miscellaneous: '#5EDDC0',
  Nonstandard: '#2DD4BF',
  Punctuation: '#F5A623',
  Readability: '#4BC584',
  Redundancy: '#7CB3D9',
  Regionalism: '#D8A0E0',
  Repetition: '#34D399',
  Spelling: '#FF6B8A',
  Style: '#FFE066',
  Typo: '#FF9466',
  Usage: '#60B3FF',
  WordChoice: '#4ADE80',
};

const fallback = '#6c757d';
const fallbackDark = '#9CA3AF';

export function kindCSS(): string {
  let css = '';

  css += `.cm-harper-lint { text-decoration: underline solid ${fallback} 2px; background-color: ${fallback}22; }\n`;
  css += `.harper-badge { color: ${fallback}; background-color: ${fallback}22; }\n`;

  for (const [kind, color] of Object.entries(kindColors)) {
    css += `.cm-harper-lint[data-lint-kind="${kind}"] { text-decoration: underline solid ${color} 2px; background-color: ${color}22; }\n`;
    css += `.harper-badge[data-kind="${kind}"] { color: ${color}; background-color: ${color}22; }\n`;
  }

  css += '@media (prefers-color-scheme: dark) {\n';
  css += `  .cm-harper-lint { text-decoration: underline solid ${fallbackDark} 2px; background-color: ${fallbackDark}22; }\n`;
  css += `  .harper-badge { color: ${fallbackDark}; background-color: ${fallbackDark}22; }\n`;
  for (const [kind] of Object.entries(kindColors)) {
    const dark = kindColorsDark[kind] ?? kindColors[kind];
    css += `  .cm-harper-lint[data-lint-kind="${kind}"] { text-decoration: underline solid ${dark} 2px; background-color: ${dark}22; }\n`;
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
  },
});
