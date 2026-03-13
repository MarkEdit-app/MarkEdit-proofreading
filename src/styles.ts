import { EditorView } from '@codemirror/view';

export const styles = EditorView.baseTheme({
  '.cm-harper-lint': {
    backgroundImage: 'url("data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="6" height="3">' +
      '<path d="M0 3 L1.5 0 L3 3 L4.5 0 L6 3" fill="none" stroke="rgba(30,120,220,0.8)" stroke-width="1.2"/>' +
      '</svg>'
    ) + '")',
    backgroundRepeat: 'repeat-x',
    backgroundPosition: 'bottom',
    paddingBottom: '1px',
  },
  '.cm-harper-tooltip': {
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: '12px',
    lineHeight: '1.4',
    padding: '6px 8px',
    maxWidth: '320px',
  },
  '.cm-harper-tooltip-message': {
    color: 'inherit',
    marginBottom: '4px',
  },
  '.cm-harper-tooltip-suggestions': {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  '.cm-harper-tooltip-button': {
    background: 'rgba(30, 120, 220, 0.15)',
    color: 'rgb(30, 120, 220)',
    border: 'none',
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    '&:hover': {
      background: 'rgba(30, 120, 220, 0.25)',
    },
  },
});
