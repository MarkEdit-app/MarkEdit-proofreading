import { StateField, StateEffect } from '@codemirror/state';
import { showTooltip, EditorView } from '@codemirror/view';
import type { Tooltip, TooltipView } from '@codemirror/view';
import { diagnosticsField } from './decoration';
import type { Diagnostic } from './decoration';
import { setAccentColor, buildCardContent, ignoreDiagnostic, injectCardCSS } from './card';

export const setClickTooltip = StateEffect.define<Diagnostic | null>();

export const clickTooltipField = StateField.define<Tooltip | null>({
  create() {
    return null;
  },
  update(value, tr) {
    if (tr.docChanged) return null;

    for (const effect of tr.effects) {
      if (effect.is(setClickTooltip)) {
        const diagnostic = effect.value;
        if (!diagnostic) return null;

        return {
          pos: diagnostic.from,
          above: true,
          create(view) {
            return createTooltip(view, diagnostic);
          },
        };
      }
    }

    return value;
  },
  provide: f => showTooltip.from(f),
});

export const tooltipHandlers = EditorView.domEventHandlers({
  mousedown(event) {
    const target = event.target as HTMLElement;
    if (target.closest('.cm-tooltip')) return false;
    if (!target.closest('.cm-harper-lint')) return false;

    event.preventDefault();
    return true;
  },
  mouseup(event, view) {
    const target = event.target as HTMLElement;
    if (target.closest('.cm-tooltip')) return false;

    if (target.closest('.cm-harper-lint')) {
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
      if (pos !== null) {
        const { diagnostics } = view.state.field(diagnosticsField);
        const found = diagnostics.find(d => pos >= d.from && pos <= d.to);
        if (found) {
          view.dispatch({ effects: setClickTooltip.of(found) });
          return true;
        }
      }
    }

    if (view.state.field(clickTooltipField) !== null) {
      view.dispatch({ effects: setClickTooltip.of(null) });
    }

    return false;
  },
  keydown(event, view) {
    if (event.key === 'Escape' && view.state.field(clickTooltipField) !== null) {
      view.dispatch({ effects: setClickTooltip.of(null) });
      return true;
    }
    return false;
  },
});

// Tooltip-specific CSS — container, backdrop, close button, and size overrides
// for the shared `.harper-msg`, `.harper-btn`, `.harper-ignore` base styles.
export const tooltipCSS = `
  .harper-card {
    position: relative;
    border-radius: 10px;
    overflow: hidden;
    max-width: 320px;
    min-width: 220px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    background: rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(0, 0, 0, 0.2) !important;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18), 0 1px 6px rgba(0, 0, 0, 0.1);
  }
  .harper-card .harper-bg {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: rgba(255, 255, 255, 0.7);
    pointer-events: none;
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
  }
  .harper-card .harper-close {
    position: absolute;
    top: 5px;
    right: 5px;
    background: none;
    border: none;
    cursor: pointer;
    color: #888;
    padding: 4px;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .harper-card .harper-close:hover { color: #444; }
  .harper-card .harper-content {
    position: relative;
    padding: 12px;
  }
  .harper-card .harper-msg { color: #222222; font-size: 13px; margin: 8px 0 25px; }
  .harper-card .harper-msg code { font-size: 12px; padding: 1px 4px; }
  .harper-card .harper-btn { padding: 2px 6px; font-size: 12px; }
  .harper-card .harper-ignore { padding: 2px 6px; font-size: 12px; }
  @media (prefers-color-scheme: dark) {
    .harper-card {
      background: rgba(40, 40, 40, 0.4);
      border-color: rgba(255, 255, 255, 0.2) !important;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5), 0 1px 6px rgba(0, 0, 0, 0.3);
    }
    .harper-card .harper-bg {
      background: rgba(40, 40, 40, 0.7);
    }
    .harper-card .harper-close { color: #777; }
    .harper-card .harper-close:hover { color: #bbb; }
    .harper-card .harper-msg { color: #cccccc; }
  }
`;

function createTooltip(view: EditorView, diagnostic: Diagnostic) {
  injectCardCSS();

  if (!document.getElementById('harper-tooltip-styles')) {
    const style = document.createElement('style');
    style.id = 'harper-tooltip-styles';
    style.textContent = tooltipCSS;
    document.head.appendChild(style);
  }

  const dom = document.createElement('div');
  dom.className = 'harper-tooltip-wrap';

  const card = document.createElement('div');
  card.className = 'harper-card';
  setAccentColor(card, diagnostic.lintKind);

  // Background layer for translucent blended color
  const bg = document.createElement('div');
  bg.className = 'harper-bg';
  card.appendChild(bg);

  // Close button at card level (top-right corner)
  const close = document.createElement('button');
  close.className = 'harper-close';
  close.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>';
  close.title = 'Close';
  close.ariaLabel = 'Close';
  close.onmousedown = (e) => e.preventDefault();
  close.onclick = () => {
    view.dispatch({ effects: setClickTooltip.of(null) });
  };
  card.appendChild(close);

  const content = document.createElement('div');
  content.className = 'harper-content';

  // Header: badge only
  const badge = document.createElement('span');
  badge.className = 'harper-badge';
  badge.setAttribute('data-kind', diagnostic.lintKind);
  badge.style.cssText = `
    display: inline-block;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2px;
  `;
  badge.textContent = diagnostic.title;
  content.appendChild(badge);

  // Shared card content: message + actions (suggestion buttons + ignore)
  buildCardContent(content, view, diagnostic, {
    onIgnore: (_container, diag) => {
      ignoreDiagnostic(view, diag, [setClickTooltip.of(null)]);
    },
  });

  card.appendChild(content);
  dom.appendChild(card);

  return {
    dom,
    offset: { x: -6, y: 8 },
    mount() {
      const wrapper = dom.closest('.cm-tooltip') as HTMLElement | null;
      if (wrapper) {
        wrapper.style.background = 'transparent';
        wrapper.style.border = 'none';
        wrapper.style.padding = '0 12px 0 0';
        wrapper.style.width = 'max-content';
      }
    },
  } as TooltipView;
}
