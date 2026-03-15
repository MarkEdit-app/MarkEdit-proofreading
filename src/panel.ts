import { StateField, StateEffect } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { EditorView, ViewPlugin } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import { diagnosticsField, setDiagnosticsEffect } from './decoration';
import type { Diagnostic } from './decoration';
import { kindColors, kindColorsDark } from './styling';

const fallback = '#6c757d';
const fallbackDark = '#9CA3AF';
const paneWidth = 320;

/** Toggle the review-problems pane open / closed. */
export const togglePanelEffect = StateEffect.define<boolean>();

const panelOpenField = StateField.define<boolean>({
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
});

const panelPlugin = ViewPlugin.fromClass(class {
  private pane: HTMLElement | null = null;

  constructor(readonly view: EditorView) {
    this.sync();
  }

  update(update: ViewUpdate) {
    const panelToggled = update.transactions.some(tr =>
      tr.effects.some(e => e.is(togglePanelEffect)),
    );

    if (panelToggled) {
      this.sync();
      return;
    }

    // Re-render content when diagnostics change while open
    if (this.pane) {
      const diagChanged = update.transactions.some(tr =>
        tr.effects.some(e => e.is(setDiagnosticsEffect)),
      );
      if (diagChanged) {
        this.renderContent();
      }
    }
  }

  sync() {
    const open = this.view.state.field(panelOpenField);
    if (open && !this.pane) {
      this.open();
    } else if (!open && this.pane) {
      this.close();
    }
  }

  open() {
    injectPaneCSS();

    const pane = document.createElement('div');
    pane.className = 'harper-pane';
    this.pane = pane;

    this.renderContent();

    // Insert sidebar inside .cm-editor, next to .cm-scroller
    this.view.dom.appendChild(pane);
    this.view.dom.classList.add('harper-pane-open');
    this.view.scrollDOM.style.marginRight = `${paneWidth}px`;
  }

  close() {
    if (this.pane) {
      this.pane.remove();
      this.pane = null;
    }
    this.view.dom.classList.remove('harper-pane-open');
    this.view.scrollDOM.style.marginRight = '';
  }

  renderContent() {
    if (!this.pane) return;
    renderPane(this.pane, this.view);
  }

  destroy() {
    this.close();
  }
});

/** All extensions needed for the review-problems pane. */
export const panelExtension: Extension = [panelOpenField, panelPlugin];

// ─── Rendering ────────────────────────────────────────────────────────────────

function renderPane(dom: HTMLElement, view: EditorView) {
  dom.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.className = 'harper-pane-header';

  const title = document.createElement('span');
  title.className = 'harper-pane-title';
  title.textContent = 'Problems';
  header.appendChild(title);

  const headerActions = document.createElement('div');
  headerActions.className = 'harper-pane-header-actions';

  const ignoreAllBtn = document.createElement('button');
  ignoreAllBtn.className = 'harper-pane-action';
  ignoreAllBtn.textContent = 'Ignore All';
  ignoreAllBtn.onclick = () => {
    view.dispatch({ effects: setDiagnosticsEffect.of([]) });
  };
  headerActions.appendChild(ignoreAllBtn);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'harper-pane-close';
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
  body.className = 'harper-pane-body';

  const { diagnostics } = view.state.field(diagnosticsField);

  if (diagnostics.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'harper-pane-empty';
    empty.textContent = 'No problems found.';
    body.appendChild(empty);
    dom.appendChild(body);
    return;
  }

  // Group diagnostics by kind
  const groups = groupByKind(diagnostics);

  for (const [kind, items] of groups) {
    const section = document.createElement('div');
    section.className = 'harper-pane-section';

    // Set accent color on the section for use by heading
    const color = kindColors[kind] ?? fallback;
    const darkColor = kindColorsDark[kind] ?? fallbackDark;
    section.style.setProperty('--harper-kind-color', color);
    section.style.setProperty('--harper-kind-color-dark', darkColor);

    // Section heading with category badge and accent color
    const heading = document.createElement('div');
    heading.className = 'harper-pane-section-heading';

    const badge = document.createElement('span');
    badge.className = 'harper-badge';
    badge.setAttribute('data-kind', kind);
    badge.textContent = items[0].title;
    heading.appendChild(badge);

    const count = document.createElement('span');
    count.className = 'harper-pane-count';
    count.textContent = `${items.length}`;
    heading.appendChild(count);

    section.appendChild(heading);

    // Items
    for (const diag of items) {
      const card = document.createElement('div');
      card.className = 'harper-pane-item';

      // Problem text (flagged word)
      if (diag.problemText) {
        const word = document.createElement('span');
        word.className = 'harper-pane-word';
        word.textContent = diag.problemText;
        card.appendChild(word);
      }

      // Message
      const msg = document.createElement('div');
      msg.className = 'harper-pane-msg';
      msg.innerHTML = diag.messageHtml;
      card.appendChild(msg);

      // Actions row
      if (diag.actions.length > 0) {
        const actions = document.createElement('div');
        actions.className = 'harper-pane-actions';

        for (const action of diag.actions) {
          const btn = document.createElement('button');
          btn.className = 'harper-pane-btn';
          btn.textContent = action.name;
          btn.onmousedown = (e) => e.preventDefault();
          btn.onclick = (e) => {
            e.stopPropagation();
            const current = view.state.field(diagnosticsField).diagnostics.find(d =>
              d.from === diag.from && d.to === diag.to && d.lintKind === diag.lintKind,
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
          d.from === diag.from && d.to === diag.to && d.lintKind === diag.lintKind,
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

export function paneCSS(): string {
  let css = `
.harper-pane {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: ${paneWidth}px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.6);
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  z-index: 1;
  box-sizing: border-box;
}
.harper-pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}
.harper-pane-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  letter-spacing: 0.1px;
}
.harper-pane-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.harper-pane-action {
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
.harper-pane-action:hover {
  background: #eaeef2;
  border-color: #afb8c1;
}
.harper-pane-action:active {
  background: #d8dee4;
}
.harper-pane-close {
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
.harper-pane-close:hover {
  color: #444;
  background: rgba(0, 0, 0, 0.06);
}
.harper-pane-close:active {
  background: rgba(0, 0, 0, 0.1);
}
.harper-pane-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 0;
  min-height: 0;
}
.harper-pane-empty {
  padding: 24px 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
.harper-pane-section {
  margin-bottom: 8px;
}
.harper-pane-section-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 6px 9px;
  margin: 0 8px;
  border-left: 3px solid var(--harper-kind-color, ${fallback});
}
.harper-pane-section-heading .harper-badge {
  display: inline-block;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2px;
}
.harper-pane-count {
  font-size: 11px;
  color: #999;
  font-weight: 500;
}
.harper-pane-item {
  position: relative;
  margin: 6px 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.1);
  transition: background 0.15s, border-color 0.15s;
}
.harper-pane-item:hover {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.18);
}
.harper-pane-item:active {
  background: rgba(0, 0, 0, 0.06);
}
.harper-pane-word {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  word-break: break-word;
}
.harper-pane-msg {
  font-size: 12px;
  color: #555;
  line-height: 1.45;
}
.harper-pane-msg p {
  margin: 0;
}
.harper-pane-msg code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  font-size: 11px;
  padding: 1px 3px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.06);
}
.harper-pane-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}
.harper-pane-btn {
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
.harper-pane-btn:hover {
  background: #eaeef2;
  border-color: #afb8c1;
}
.harper-pane-btn:active {
  background: #d8dee4;
}
`;

  // Dark mode overrides
  css += `
@media (prefers-color-scheme: dark) {
  .harper-pane {
    background: rgba(30, 30, 30, 0.6);
    border-left-color: rgba(255, 255, 255, 0.1);
  }
  .harper-pane-header {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
  .harper-pane-title { color: #ddd; }
  .harper-pane-action {
    border-color: #555;
    background: #3d3d3d;
    color: #e0e0e0;
  }
  .harper-pane-action:hover {
    background: #4a4a4a;
    border-color: #666;
  }
  .harper-pane-action:active { background: #555; }
  .harper-pane-close { color: #777; }
  .harper-pane-close:hover { color: #bbb; background: rgba(255, 255, 255, 0.08); }
  .harper-pane-close:active { background: rgba(255, 255, 255, 0.12); }
  .harper-pane-empty { color: #777; }
  .harper-pane-count { color: #777; }
  .harper-pane-section-heading {
    border-left-color: var(--harper-kind-color-dark, ${fallbackDark});
  }
  .harper-pane-item {
    border-color: rgba(255, 255, 255, 0.1);
  }
  .harper-pane-item:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.18);
  }
  .harper-pane-item:active { background: rgba(255, 255, 255, 0.08); }
  .harper-pane-word { color: #ddd; }
  .harper-pane-msg { color: #aaa; }
  .harper-pane-msg code { background: rgba(255, 255, 255, 0.08); }
  .harper-pane-btn {
    border-color: #555;
    background: #3d3d3d;
    color: #e0e0e0;
  }
  .harper-pane-btn:hover {
    background: #4a4a4a;
    border-color: #666;
  }
  .harper-pane-btn:active { background: #555; }
}
`;

  return css;
}

function injectPaneCSS() {
  if (document.getElementById('harper-pane-styles')) return;
  const style = document.createElement('style');
  style.id = 'harper-pane-styles';
  style.textContent = paneCSS();
  document.head.appendChild(style);
}
