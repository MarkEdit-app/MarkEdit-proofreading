import { EditorView } from '@codemirror/view';

export const baseTheme = EditorView.baseTheme({
  // Base lint decoration
  '.cm-harper-lint': {
    cursor: 'default',
    borderRadius: '2px',
  },
  // Spelling errors
  '.cm-harper-spelling': {
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    textDecorationColor: '#e03e3e',
    textDecorationThickness: '2px',
    textUnderlineOffset: '3px',
    backgroundColor: 'rgba(224, 62, 62, 0.07)',
  },
  // Suggestions
  '.cm-harper-suggestion': {
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    textDecorationColor: '#0969da',
    textDecorationThickness: '2px',
    textUnderlineOffset: '3px',
    backgroundColor: 'rgba(9, 105, 218, 0.07)',
  },
  // Dark mode decorations
  '&dark .cm-harper-spelling': {
    textDecorationColor: '#f47067',
    backgroundColor: 'rgba(244, 112, 103, 0.12)',
  },
  '&dark .cm-harper-suggestion': {
    textDecorationColor: '#58a6ff',
    backgroundColor: 'rgba(88, 166, 255, 0.12)',
  },
  // Tooltip card container (class added via mount callback)
  '.cm-harper-card.cm-tooltip': {
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    background: '#ffffff',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    padding: '0',
    overflow: 'hidden',
  },
  '&dark .cm-harper-card.cm-tooltip': {
    border: '1px solid #3d3d3d',
    background: '#252525',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
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
  '.cm-harper-badge-spelling': {
    backgroundColor: 'rgba(224, 62, 62, 0.1)',
    color: '#c53030',
  },
  '.cm-harper-badge-suggestion': {
    backgroundColor: 'rgba(9, 105, 218, 0.1)',
    color: '#0550ae',
  },
  '&dark .cm-harper-badge-spelling': {
    backgroundColor: 'rgba(244, 112, 103, 0.15)',
    color: '#f47067',
  },
  '&dark .cm-harper-badge-suggestion': {
    backgroundColor: 'rgba(88, 166, 255, 0.15)',
    color: '#58a6ff',
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
