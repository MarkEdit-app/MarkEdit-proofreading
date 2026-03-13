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

export function colorForKind(kind: string): string {
  return kindColors[kind] ?? '#6c757d';
}

export const baseTheme = EditorView.baseTheme({
  // Base lint decoration
  '.cm-harper-lint': {
    cursor: 'default',
    borderRadius: '2px',
  },
  // Tooltip content
  '.cm-harper-tooltip': {
    padding: '12px 14px',
    maxWidth: '360px',
    minWidth: '180px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  },
  '.cm-harper-header': {
    marginBottom: '6px',
  },
  '.cm-harper-badge': {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '0.2px',
  },
  '.cm-harper-message': {
    fontSize: '13px',
    lineHeight: '1.5',
    color: '#444444',
    marginBottom: '10px',
  },
  '&dark .cm-harper-message': {
    color: '#aaaaaa',
  },
  '.cm-harper-actions': {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  '.cm-harper-action': {
    padding: '4px 12px',
    border: '1px solid #d0d7de',
    borderRadius: '6px',
    background: '#f6f8fa',
    color: '#24292f',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    fontFamily: 'inherit',
    lineHeight: '1.4',
    transition: 'background 0.15s, border-color 0.15s',
    '&:hover': {
      background: '#eaeef2',
      borderColor: '#afb8c1',
    },
  },
  '&dark .cm-harper-action': {
    borderColor: '#444c56',
    background: '#2d333b',
    color: '#adbac7',
    '&:hover': {
      background: '#373e47',
      borderColor: '#545d68',
    },
  },
});
