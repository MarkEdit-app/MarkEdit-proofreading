import { StateField, StateEffect } from '@codemirror/state';
import { showTooltip, EditorView } from '@codemirror/view';
import type { Tooltip, TooltipView } from '@codemirror/view';
import { diagnosticsField, setDiagnosticsEffect } from './decoration';
import { addToDictionary } from './lint';
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
  .harper-card .harper-msg { color: #444444; }
  .harper-card .harper-msg p {
    margin: 0px;
  }
  .harper-card .harper-msg code {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    font-size: 12px;
    padding: 1px 4px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.06);
  }
  .harper-card .harper-btn {
    padding: 2px 6px;
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
    padding: 2px 6px;
    border: 1px solid #c0c0c0;
    border-radius: 6px;
    background: transparent;
    color: #555;
    cursor: pointer;
    font-size: 12px;
    font-weight: 400;
    font-family: inherit;
    line-height: 1.4;
    margin-left: auto;
  }
  .harper-card .harper-ignore:hover { background: rgba(0, 0, 0, 0.05); border-color: #999; }
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
    .harper-card .harper-msg { color: #aaaaaa; }
    .harper-card .harper-msg code { background: rgba(255, 255, 255, 0.08); }
    .harper-card .harper-btn {
      border-color: #555;
      background: #3d3d3d;
      color: #e0e0e0;
    }
    .harper-card .harper-btn:hover {
      background: #4a4a4a;
      border-color: #666;
    }
    .harper-card .harper-ignore {
      border-color: #555;
      background: transparent;
      color: #bbb;
    }
    .harper-card .harper-ignore:hover { background: rgba(255, 255, 255, 0.08); border-color: #666; }
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

  // Background layer for translucent blended color
  const bg = document.createElement('div');
  bg.className = 'harper-bg';
  dom.appendChild(bg);

  // Close button at card level (top-right corner)
  const close = document.createElement('button');
  close.className = 'harper-close';
  close.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>';
  close.ariaLabel = 'Close';
  close.onmousedown = (e) => e.preventDefault();
  close.onclick = () => {
    view.dispatch({ effects: setClickTooltip.of(null) });
  };
  dom.appendChild(close);

  const content = document.createElement('div');
  content.style.cssText = 'position: relative; padding: 12px;';

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

  // Message with HTML rendering
  const msg = document.createElement('div');
  msg.className = 'harper-msg';
  msg.style.cssText = `
    font-size: 13px;
    line-height: 1.5;
    margin: 8px 0 25px;
  `;
  msg.innerHTML = diagnostic.messageHtml;
  content.appendChild(msg);

  // Actions: suggestion buttons + Add to Dictionary + Ignore
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

  if (diagnostic.problemText.length > 0) {
    const dict = document.createElement('button');
    dict.className = 'harper-ignore';
    dict.textContent = 'Add to Dictionary';
    dict.onmousedown = (e) => e.preventDefault();
    dict.onclick = () => {
      const word = diagnostic.problemText;
      void addToDictionary(word);
      const { diagnostics } = view.state.field(diagnosticsField);
      const filtered = diagnostics.filter(d => d.problemText !== word);
      view.dispatch({
        effects: [
          setClickTooltip.of(null),
          setDiagnosticsEffect.of(filtered),
        ],
      });
    };
    actions.appendChild(dict);
  }

  const ignore = document.createElement('button');
  ignore.className = 'harper-ignore';
  ignore.style.marginLeft = diagnostic.problemText.length > 0 ? '0' : '';
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
