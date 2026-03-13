import { StateField, StateEffect } from '@codemirror/state';
import { showTooltip, EditorView } from '@codemirror/view';
import type { Tooltip } from '@codemirror/view';
import { diagnosticsField } from './decoration';
import type { Diagnostic } from './decoration';
import { colorForKind } from './styling';

const setClickTooltip = StateEffect.define<Diagnostic | null>();

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
  mousedown(event, view) {
    const target = event.target as HTMLElement;
    if (target.closest('.cm-tooltip')) return false;

    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos === null) return false;

    const { diagnostics } = view.state.field(diagnosticsField);
    const found = diagnostics.find(d => pos >= d.from && pos <= d.to);

    if (found) {
      event.preventDefault();
      return true;
    }

    return false;
  },
  mouseup(event, view) {
    const target = event.target as HTMLElement;
    if (target.closest('.cm-tooltip')) return false;

    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos === null) {
      if (view.state.field(clickTooltipField) !== null) {
        view.dispatch({ effects: setClickTooltip.of(null) });
      }
      return false;
    }

    const { diagnostics } = view.state.field(diagnosticsField);
    const found = diagnostics.find(d => pos >= d.from && pos <= d.to);

    if (found) {
      view.dispatch({ effects: setClickTooltip.of(found) });
      return true;
    } else if (view.state.field(clickTooltipField) !== null) {
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

const cardCSS = `
  .harper-card {
    border-radius: 10px;
    overflow: hidden;
    max-width: 360px;
    min-width: 180px;
    margin: 0 6px 6px 6px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(0, 0, 0, 0.15);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06);
  }
  .harper-card .harper-msg { color: #444444; }
  .harper-card .harper-btn {
    padding: 4px 12px;
    border: 1px solid #d0d7de;
    border-radius: 6px;
    background: #f6f8fa;
    color: #24292f;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    font-family: inherit;
    line-height: 1.4;
  }
  .harper-card .harper-btn:hover {
    background: #eaeef2;
    border-color: #afb8c1;
  }
  @media (prefers-color-scheme: dark) {
    .harper-card {
      background: rgba(40, 40, 40, 0.82);
      border-color: rgba(255, 255, 255, 0.18);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.2);
    }
    .harper-card .harper-msg { color: #aaaaaa; }
    .harper-card .harper-btn {
      border-color: #505860;
      background: #343a44;
      color: #c9d1d9;
    }
    .harper-card .harper-btn:hover {
      background: #404850;
      border-color: #5a6570;
    }
  }
`;

function createTooltip(view: EditorView, diagnostic: Diagnostic) {
  const color = colorForKind(diagnostic.lintKind);

  if (!document.getElementById('harper-card-styles')) {
    const style = document.createElement('style');
    style.id = 'harper-card-styles';
    style.textContent = cardCSS;
    document.head.appendChild(style);
  }

  const dom = document.createElement('div');
  dom.className = 'harper-card';

  const content = document.createElement('div');
  content.style.padding = '14px 12px';

  const badge = document.createElement('span');
  badge.style.cssText = `
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2px;
    margin-bottom: 6px;
    background-color: ${color}22;
    color: ${color};
  `;
  badge.textContent = diagnostic.title;
  content.appendChild(badge);

  const msg = document.createElement('div');
  msg.className = 'harper-msg';
  msg.style.cssText = `
    font-size: 13px;
    line-height: 1.5;
    margin-bottom: 10px;
  `;
  msg.textContent = diagnostic.message;
  content.appendChild(msg);

  if (diagnostic.actions.length > 0) {
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px;';

    for (const action of diagnostic.actions) {
      const btn = document.createElement('button');
      btn.className = 'harper-btn';
      btn.textContent = action.name;
      btn.onmousedown = (e) => {
        e.preventDefault();
        const current = view.state.field(diagnosticsField).diagnostics.find(d =>
          d.from === diagnostic.from && d.to === diagnostic.to,
        );
        if (current) {
          action.apply(view, current.from, current.to);
        }
      };
      actions.appendChild(btn);
    }

    content.appendChild(actions);
  }

  dom.appendChild(content);

  return {
    dom,
    mount() {
      const wrapper = dom.closest('.cm-tooltip') as HTMLElement | null;
      if (wrapper) {
        wrapper.style.background = 'transparent';
        wrapper.style.border = 'none';
        wrapper.style.padding = '0';
      }
    },
  };
}
