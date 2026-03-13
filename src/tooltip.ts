import { StateField, StateEffect } from '@codemirror/state';
import { showTooltip, EditorView } from '@codemirror/view';
import type { Tooltip, TooltipView } from '@codemirror/view';
import { diagnosticsField, setDiagnosticsEffect } from './decoration';
import type { Diagnostic } from './decoration';

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

const cardCSS = `
  .harper-card {
    border-radius: 10px;
    overflow: hidden;
    max-width: 360px;
    min-width: 180px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.9);
    border: 0.5px solid rgba(0, 0, 0, 0.2) !important;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06);
  }
  .harper-card .harper-close {
    position: absolute;
    top: 8px;
    right: 8px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    color: #888;
    padding: 4px;
    font-family: inherit;
    z-index: 1;
  }
  .harper-card .harper-close:hover { color: #444; }
  .harper-card .harper-msg { color: #444444; }
  .harper-card .harper-msg code {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    font-size: 12px;
    padding: 1px 4px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.06);
  }
  .harper-card .harper-btn {
    padding: 3px 6px;
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
  .harper-card .harper-ignore {
    padding: 3px 6px;
    border: 1px solid #d0d7de;
    border-radius: 6px;
    background: #f6f8fa;
    color: #656d76;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    font-family: inherit;
    line-height: 1.4;
    margin-left: auto;
  }
  .harper-card .harper-ignore:hover { background: #eaeef2; border-color: #afb8c1; color: #24292f; }
  @media (prefers-color-scheme: dark) {
    .harper-card {
      background: rgba(40, 40, 40, 0.9);
      border-color: rgba(255, 255, 255, 0.2) !important;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.2);
    }
    .harper-card .harper-close { color: #777; }
    .harper-card .harper-close:hover { color: #bbb; }
    .harper-card .harper-msg { color: #aaaaaa; }
    .harper-card .harper-msg code { background: rgba(255, 255, 255, 0.08); }
    .harper-card .harper-btn {
      border-color: #505860;
      background: #343a44;
      color: #c9d1d9;
    }
    .harper-card .harper-btn:hover {
      background: #404850;
      border-color: #5a6570;
    }
    .harper-card .harper-ignore {
      border-color: #505860;
      background: #343a44;
      color: #8b949e;
    }
    .harper-card .harper-ignore:hover { background: #404850; border-color: #5a6570; color: #c9d1d9; }
  }
`;

function createTooltip(view: EditorView, diagnostic: Diagnostic) {
  if (!document.getElementById('harper-card-styles')) {
    const style = document.createElement('style');
    style.id = 'harper-card-styles';
    style.textContent = cardCSS;
    document.head.appendChild(style);
  }

  const dom = document.createElement('div');
  dom.className = 'harper-card';
  dom.style.position = 'relative';

  // Close button at card level (top-right corner)
  const close = document.createElement('button');
  close.className = 'harper-close';
  close.textContent = '✕';
  close.onmousedown = (e) => e.preventDefault();
  close.onclick = () => {
    view.dispatch({ effects: setClickTooltip.of(null) });
  };
  dom.appendChild(close);

  const content = document.createElement('div');
  content.style.padding = '15px';

  // Header: badge only
  const badge = document.createElement('span');
  badge.className = 'harper-badge';
  badge.setAttribute('data-kind', diagnostic.lintKind);
  badge.style.cssText = `
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2px;
  `;
  badge.textContent = diagnostic.title;
  content.appendChild(badge);

  // Message with HTML rendering
  const msg = document.createElement('div');
  msg.className = 'harper-msg';
  msg.style.cssText = `
    font-size: 13px;
    line-height: 1.5;
    margin: 8px 0 10px;
  `;
  msg.innerHTML = diagnostic.messageHtml;
  content.appendChild(msg);

  // Actions: suggestion buttons + Ignore
  const actions = document.createElement('div');
  actions.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; align-items: center;';

  for (const action of diagnostic.actions) {
    const btn = document.createElement('button');
    btn.className = 'harper-btn';
    btn.textContent = action.name;
    btn.onmousedown = (e) => e.preventDefault();
    btn.onclick = () => {
      const current = view.state.field(diagnosticsField).diagnostics.find(d =>
        d.from === diagnostic.from && d.to === diagnostic.to,
      );
      if (current) {
        action.apply(view, current.from, current.to);
      }
    };
    actions.appendChild(btn);
  }

  const ignore = document.createElement('button');
  ignore.className = 'harper-ignore';
  ignore.textContent = 'Ignore';
  ignore.onmousedown = (e) => e.preventDefault();
  ignore.onclick = () => {
    const { diagnostics } = view.state.field(diagnosticsField);
    const filtered = diagnostics.filter(d =>
      !(d.from === diagnostic.from && d.to === diagnostic.to && d.lintKind === diagnostic.lintKind),
    );
    view.dispatch({
      effects: [
        setClickTooltip.of(null),
        setDiagnosticsEffect.of(filtered),
      ],
    });
  };
  actions.appendChild(ignore);

  content.appendChild(actions);
  dom.appendChild(content);

  return {
    dom,
    offset: { x: -6, y: 8 },
    mount() {
      const wrapper = dom.closest('.cm-tooltip') as HTMLElement | null;
      if (wrapper) {
        wrapper.style.background = 'transparent';
        wrapper.style.border = 'none';
        wrapper.style.padding = '0';
        wrapper.style.width = 'max-content';
      }
    },
  } as TooltipView;
}
