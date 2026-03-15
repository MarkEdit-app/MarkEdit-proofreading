import { StateField, StateEffect } from '@codemirror/state';
import { EditorView, showPanel } from '@codemirror/view';
import type { Panel } from '@codemirror/view';
import { diagnosticsField, setDiagnosticsEffect } from './decoration';
import type { Diagnostic } from './decoration';
import { kindColors, kindColorsDark } from './styling';

const fallback = '#6c757d';
const fallbackDark = '#9CA3AF';

/** Toggle the review-problems pane open / closed. */
export const togglePanelEffect = StateEffect.define<boolean>();

export const panelField = StateField.define<boolean>({
  create() {
    return false;
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(togglePanelEffect)) {
        return effect.value;
      }
    }
    return value;
  },
  provide: f => showPanel.from(f, open => open ? createPanel : null),
});

function createPanel(view: EditorView): Panel {
  injectPanelCSS();

  const dom = document.createElement('div');
  dom.className = 'harper-panel';

  const render = () => renderPanel(dom, view);
  render();

  return {
    dom,
    update(update) {
      // Re-render when diagnostics change or panel is toggled
      for (const effect of update.transactions.flatMap(tr => tr.effects)) {
        if (effect.is(setDiagnosticsEffect) || effect.is(togglePanelEffect)) {
          render();
          return;
        }
      }
    },
    top: false,
  };
}

function renderPanel(dom: HTMLElement, view: EditorView) {
  dom.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'harper-panel-header';

  const title = document.createElement('span');
  title.className = 'harper-panel-title';
  title.textContent = 'Problems';
  header.appendChild(title);

  const headerActions = document.createElement('div');
  headerActions.className = 'harper-panel-header-actions';

  const ignoreAllBtn = document.createElement('button');
  ignoreAllBtn.className = 'harper-panel-action';
  ignoreAllBtn.textContent = 'Ignore All';
  ignoreAllBtn.onclick = () => {
    view.dispatch({ effects: setDiagnosticsEffect.of([]) });
  };
  headerActions.appendChild(ignoreAllBtn);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'harper-panel-close';
  closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>';
  closeBtn.ariaLabel = 'Close';
  closeBtn.onclick = () => {
    view.dispatch({ effects: togglePanelEffect.of(false) });
  };
  headerActions.appendChild(closeBtn);

  header.appendChild(headerActions);
  dom.appendChild(header);

  // Body – scrollable list
  const body = document.createElement('div');
  body.className = 'harper-panel-body';

  const { diagnostics } = view.state.field(diagnosticsField);

  if (diagnostics.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'harper-panel-empty';
    empty.textContent = 'No problems found.';
    body.appendChild(empty);
    dom.appendChild(body);
    return;
  }

  // Group diagnostics by kind
  const groups = groupByKind(diagnostics);

  for (const [kind, items] of groups) {
    const section = document.createElement('div');
    section.className = 'harper-panel-section';

    // Section heading with category badge
    const heading = document.createElement('div');
    heading.className = 'harper-panel-section-heading';

    const badge = document.createElement('span');
    badge.className = 'harper-badge';
    badge.setAttribute('data-kind', kind);
    badge.textContent = items[0].title;
    heading.appendChild(badge);

    const count = document.createElement('span');
    count.className = 'harper-panel-count';
    count.textContent = `${items.length}`;
    heading.appendChild(count);

    section.appendChild(heading);

    // Items
    for (const diag of items) {
      const card = document.createElement('div');
      card.className = 'harper-panel-item';
      card.setAttribute('data-lint-kind', kind);

      // Colored left border
      const color = kindColors[kind] ?? fallback;
      const darkColor = kindColorsDark[kind] ?? fallbackDark;
      card.style.setProperty('--harper-kind-color', color);
      card.style.setProperty('--harper-kind-color-dark', darkColor);

      // Problem text (flagged word)
      if (diag.problemText) {
        const word = document.createElement('span');
        word.className = 'harper-panel-word';
        word.textContent = diag.problemText;
        card.appendChild(word);
      }

      // Message
      const msg = document.createElement('div');
      msg.className = 'harper-panel-msg';
      msg.innerHTML = diag.messageHtml;
      card.appendChild(msg);

      // Actions row
      if (diag.actions.length > 0) {
        const actions = document.createElement('div');
        actions.className = 'harper-panel-actions';

        for (const action of diag.actions) {
          const btn = document.createElement('button');
          btn.className = 'harper-panel-btn';
          btn.textContent = action.name;
          btn.onmousedown = (e) => e.preventDefault();
          btn.onclick = (e) => {
            e.stopPropagation();
            const current = view.state.field(diagnosticsField).diagnostics.find(d =>
              d.from === diag.from && d.to === diag.to,
            );
            if (current) {
              action.apply(view, current.from, current.to);
            }
          };
          actions.appendChild(btn);
        }

        card.appendChild(actions);
      }

      // Click to focus the issue in the editor
      card.onclick = () => {
        const current = view.state.field(diagnosticsField).diagnostics.find(d =>
          d.from === diag.from && d.to === diag.to,
        );
        if (current) {
          view.dispatch({
            selection: { anchor: current.from, head: current.to },
            scrollIntoView: true,
          });
          view.focus();
        }
      };

      section.appendChild(card);
    }

    body.appendChild(section);
  }

  dom.appendChild(body);
}

function groupByKind(diagnostics: Diagnostic[]): [string, Diagnostic[]][] {
  const map = new Map<string, Diagnostic[]>();
  for (const d of diagnostics) {
    const list = map.get(d.lintKind);
    if (list) {
      list.push(d);
    } else {
      map.set(d.lintKind, [d]);
    }
  }
  return [...map.entries()];
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

export function panelCSS(): string {
  let css = `
.harper-panel {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.6);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  height: 100%;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  overflow: hidden;
}
.harper-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}
.harper-panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  letter-spacing: 0.1px;
}
.harper-panel-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.harper-panel-action {
  padding: 3px 8px;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #f6f8fa;
  color: #24292f;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  font-family: inherit;
  line-height: 1.4;
  transition: background 0.15s, border-color 0.15s;
}
.harper-panel-action:hover {
  background: #eaeef2;
  border-color: #afb8c1;
}
.harper-panel-action:active {
  background: #d8dee4;
}
.harper-panel-close {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}
.harper-panel-close:hover {
  color: #444;
  background: rgba(0, 0, 0, 0.06);
}
.harper-panel-close:active {
  background: rgba(0, 0, 0, 0.1);
}
.harper-panel-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 0;
}
.harper-panel-empty {
  padding: 24px 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
.harper-panel-section {
  margin-bottom: 4px;
}
.harper-panel-section-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 4px;
}
.harper-panel-section-heading .harper-badge {
  display: inline-block;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
}
.harper-panel-count {
  font-size: 11px;
  color: #999;
  font-weight: 500;
}
.harper-panel-item {
  position: relative;
  margin: 2px 8px;
  padding: 8px 10px 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  border-left: 3px solid var(--harper-kind-color, ${fallback});
  transition: background 0.15s;
}
.harper-panel-item:hover {
  background: rgba(0, 0, 0, 0.04);
}
.harper-panel-item:active {
  background: rgba(0, 0, 0, 0.07);
}
.harper-panel-word {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  word-break: break-word;
}
.harper-panel-msg {
  font-size: 12px;
  color: #555;
  line-height: 1.45;
}
.harper-panel-msg p {
  margin: 0;
}
.harper-panel-msg code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  font-size: 11px;
  padding: 1px 3px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.06);
}
.harper-panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}
.harper-panel-btn {
  padding: 2px 6px;
  border: 1px solid #d0d7de;
  border-radius: 5px;
  background: #f6f8fa;
  color: #24292f;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  font-family: inherit;
  line-height: 1.4;
  transition: background 0.15s, border-color 0.15s;
}
.harper-panel-btn:hover {
  background: #eaeef2;
  border-color: #afb8c1;
}
.harper-panel-btn:active {
  background: #d8dee4;
}
`;

  // Dark mode overrides
  css += `
@media (prefers-color-scheme: dark) {
  .harper-panel {
    background: rgba(30, 30, 30, 0.6);
    border-left-color: rgba(255, 255, 255, 0.1);
  }
  .harper-panel-header {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
  .harper-panel-title { color: #ddd; }
  .harper-panel-action {
    border-color: #555;
    background: #3d3d3d;
    color: #e0e0e0;
  }
  .harper-panel-action:hover {
    background: #4a4a4a;
    border-color: #666;
  }
  .harper-panel-action:active { background: #555; }
  .harper-panel-close { color: #777; }
  .harper-panel-close:hover { color: #bbb; background: rgba(255, 255, 255, 0.08); }
  .harper-panel-close:active { background: rgba(255, 255, 255, 0.12); }
  .harper-panel-empty { color: #777; }
  .harper-panel-count { color: #777; }
  .harper-panel-item {
    border-left-color: var(--harper-kind-color-dark, ${fallbackDark});
  }
  .harper-panel-item:hover { background: rgba(255, 255, 255, 0.05); }
  .harper-panel-item:active { background: rgba(255, 255, 255, 0.08); }
  .harper-panel-word { color: #ddd; }
  .harper-panel-msg { color: #aaa; }
  .harper-panel-msg code { background: rgba(255, 255, 255, 0.08); }
  .harper-panel-btn {
    border-color: #555;
    background: #3d3d3d;
    color: #e0e0e0;
  }
  .harper-panel-btn:hover {
    background: #4a4a4a;
    border-color: #666;
  }
  .harper-panel-btn:active { background: #555; }
}
`;

  return css;
}

function injectPanelCSS() {
  if (document.getElementById('harper-panel-styles')) return;
  const style = document.createElement('style');
  style.id = 'harper-panel-styles';
  style.textContent = panelCSS();
  document.head.appendChild(style);
}
