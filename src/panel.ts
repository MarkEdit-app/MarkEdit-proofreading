import { StateField, StateEffect } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { EditorView, ViewPlugin } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import { diagnosticsField, setDiagnosticsEffect } from './decoration';
import type { Diagnostic } from './decoration';
import { kindColors, kindColorsDark } from './styling';

const fallback = '#6c757d';
const fallbackDark = '#B8C0CC';
const paneWidth = 290;

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

    // Animate margin and pane slide-in on next frame
    this.view.scrollDOM.style.transition = 'margin-right 0.2s ease-out';
    requestAnimationFrame(() => {
      pane.classList.add('harper-pane-visible');
      this.view.scrollDOM.style.marginRight = `${paneWidth}px`;
    });
  }

  close() {
    if (this.pane) {
      this.pane.classList.remove('harper-pane-visible');
      this.view.scrollDOM.style.marginRight = '';

      // Remove DOM after the transition ends
      const pane = this.pane;
      this.pane = null;
      const onEnd = () => {
        pane.removeEventListener('transitionend', onEnd);
        pane.remove();
      };
      pane.addEventListener('transitionend', onEnd);
      // Safety fallback in case transitionend doesn't fire
      setTimeout(() => { if (pane.parentNode) pane.remove(); }, 250);
    }
    this.view.dom.classList.remove('harper-pane-open');
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

  const titleWrap = document.createElement('div');
  titleWrap.className = 'harper-pane-title-wrap';

  const title = document.createElement('span');
  title.className = 'harper-pane-title';
  title.textContent = 'Problems';
  titleWrap.appendChild(title);

  const { diagnostics } = view.state.field(diagnosticsField);

  const totalCount = document.createElement('span');
  totalCount.className = 'harper-pane-total';
  totalCount.textContent = `${diagnostics.length}`;
  titleWrap.appendChild(totalCount);

  header.appendChild(titleWrap);

  const headerActions = document.createElement('div');
  headerActions.className = 'harper-pane-header-actions';

  const ignoreAllBtn = document.createElement('button');
  ignoreAllBtn.className = 'harper-pane-action';
  ignoreAllBtn.textContent = 'Ignore All';
  ignoreAllBtn.onclick = () => {
    view.dispatch({ effects: [setDiagnosticsEffect.of([]), togglePanelEffect.of(false)] });
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
            effects: EditorView.scrollIntoView(current.from, { y: 'center' }),
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
  transform: translateX(100%);
  transition: transform 0.2s ease-out;
}
.harper-pane.harper-pane-visible {
  transform: translateX(0);
}
.harper-pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}
.harper-pane-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.harper-pane-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: 0.1px;
}
.harper-pane-total {
  font-size: 12px;
  font-weight: 500;
  color: #888;
}
.harper-pane-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.harper-pane-action {
  padding: 4px 10px;
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
  padding: 5px;
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
  padding: 8px 0 16px;
  min-height: 0;
}
.harper-pane-empty {
  padding: 32px 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
.harper-pane-section {
  margin-bottom: 12px;
}
.harper-pane-section-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px 6px;
}
.harper-pane-section-heading .harper-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
}
.harper-pane-count {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}
.harper-pane-item {
  position: relative;
  margin: 8px 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.harper-pane-item:hover {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}
.harper-pane-item:active {
  background: rgba(0, 0, 0, 0.05);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.harper-pane-word {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 3px;
  word-break: break-word;
}
.harper-pane-msg {
  font-size: 12px;
  color: #555;
  line-height: 1.5;
}
.harper-pane-msg p {
  margin: 0;
}
.harper-pane-msg code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--harper-kind-color, #24292f);
  background: color-mix(in srgb, var(--harper-kind-color, #6c757d) 10%, transparent);
}
.harper-pane-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.harper-pane-btn {
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
  .harper-pane-title { color: #f0f0f0; }
  .harper-pane-total { color: #999; }
  .harper-pane-action {
    border-color: #464a4f;
    background: #323639;
    color: #e2e4e8;
  }
  .harper-pane-action:hover {
    background: #3a3e42;
    border-color: #525659;
  }
  .harper-pane-action:active { background: #42464a; }
  .harper-pane-close { color: #999; }
  .harper-pane-close:hover { color: #ddd; background: rgba(255, 255, 255, 0.1); }
  .harper-pane-close:active { background: rgba(255, 255, 255, 0.15); }
  .harper-pane-empty { color: #999; }
  .harper-pane-count { color: #999; }
  .harper-pane-item {
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }
  .harper-pane-item:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  .harper-pane-item:active {
    background: rgba(255, 255, 255, 0.06);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  }
  .harper-pane-word { color: #f0f0f0; }
  .harper-pane-msg { color: #bbb; }
  .harper-pane-msg code {
    color: var(--harper-kind-color-dark, #f0f0f0);
    background: color-mix(in srgb, var(--harper-kind-color-dark, #B8C0CC) 15%, transparent);
  }
  .harper-pane-btn {
    border-color: #464a4f;
    background: #323639;
    color: #e2e4e8;
  }
  .harper-pane-btn:hover {
    background: #3a3e42;
    border-color: #525659;
  }
  .harper-pane-btn:active { background: #42464a; }
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
