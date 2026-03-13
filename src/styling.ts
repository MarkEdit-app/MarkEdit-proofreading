import { EditorView } from '@codemirror/view';

export const baseTheme = EditorView.baseTheme({
  '.cm-harper-lint': {
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'6\' height=\'3\'%3E%3Cpath d=\'m0 3 l2 -2 l1 0 l2 2 l1 0\' stroke=\'%23d4a017\' fill=\'none\' stroke-width=\'.7\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'repeat-x',
    backgroundPosition: 'bottom',
    paddingBottom: '0.7px',
  },
  '.cm-harper-tooltip': {
    padding: '4px 8px',
    maxWidth: '400px',
  },
  '.cm-harper-diagnostic + .cm-harper-diagnostic': {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #ddd',
  },
  '.cm-harper-title': {
    fontWeight: 'bold',
    marginBottom: '2px',
    fontSize: '13px',
  },
  '.cm-harper-message': {
    fontSize: '12px',
    lineHeight: '1.4',
    marginBottom: '4px',
  },
  '.cm-harper-actions': {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  '.cm-harper-action': {
    padding: '2px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: '#f5f5f5',
    cursor: 'pointer',
    fontSize: '12px',
    '&:hover': {
      background: '#e0e0e0',
    },
  },
  '&dark .cm-harper-diagnostic + .cm-harper-diagnostic': {
    borderTopColor: '#444',
  },
  '&dark .cm-harper-action': {
    borderColor: '#555',
    background: '#333',
    color: '#eee',
    '&:hover': {
      background: '#444',
    },
  },
});
