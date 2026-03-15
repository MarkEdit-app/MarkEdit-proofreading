/**
 * Shared card content helpers for both the popup tooltip and the sidebar pane.
 *
 * Both UIs present a diagnostic card with the same inner structure:
 *   message HTML → action buttons (→ optional ignore button)
 *
 * This module provides the DOM-building logic, diagnostic lookup helpers,
 * and shared base CSS so neither consumer duplicates the card internals.
 */

import type { StateEffect } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { diagnosticsField, setDiagnosticsEffect } from './decoration';
import type { Diagnostic } from './decoration';
import { addToDictionary, shouldAddToDict } from './lint';
import { kindColors, kindColorsDark, fallback, fallbackDark, injectStyleSheet } from './styling';

/** Set `--harper-kind-color` / `--harper-kind-color-dark` CSS custom properties on an element. */
export function setAccentColor(el: HTMLElement, lintKind: string) {
  el.style.setProperty('--harper-kind-color', kindColors[lintKind] ?? fallback);
  el.style.setProperty('--harper-kind-color-dark', kindColorsDark[lintKind] ?? fallbackDark);
}

/** Find the current (position-mapped) diagnostic matching by from/to/kind. */
export function findDiagnostic(view: EditorView, diag: Diagnostic): Diagnostic | undefined {
  return view.state.field(diagnosticsField).diagnostics.find(d =>
    d.from === diag.from && d.to === diag.to && d.lintKind === diag.lintKind,
  );
}

/** Remove a diagnostic from state and optionally add its word to the dictionary. */
export function ignoreDiagnostic(view: EditorView, diag: Diagnostic, extraEffects: StateEffect<unknown>[] = []) {
  if (shouldAddToDict && diag.problemText) {
    void addToDictionary(diag.problemText);
  }
  const { diagnostics } = view.state.field(diagnosticsField);
  const filtered = diagnostics.filter(d =>
    !(d.from === diag.from && d.to === diag.to && d.lintKind === diag.lintKind),
  );
  view.dispatch({ effects: [setDiagnosticsEffect.of(filtered), ...extraEffects] });
}

export interface CardCallbacks {
  /** Return false to prevent the action (e.g. during dismiss animation). */
  guard?: (container: HTMLElement) => boolean;
  /** Called after a suggestion action is applied. */
  onApply?: (container: HTMLElement) => void;
  /** Called when "Ignore" is clicked. */
  onIgnore?: (container: HTMLElement, diag: Diagnostic) => void;
  /** Whether to show the "Ignore" button (default: true). */
  showIgnore?: boolean;
}

/**
 * Build the inner content of a diagnostic card:
 * message HTML + actions row (suggestion buttons + optional ignore button).
 *
 * Appends `.harper-msg` and `.harper-actions` children to `container`.
 */
export function buildCardContent(
  container: HTMLElement,
  view: EditorView,
  diagnostic: Diagnostic,
  callbacks: CardCallbacks = {},
) {
  // Message
  const msg = document.createElement('div');
  msg.className = 'harper-msg';
  msg.innerHTML = diagnostic.messageHtml;
  container.appendChild(msg);

  // Actions row
  const actions = document.createElement('div');
  actions.className = 'harper-actions';

  for (const action of diagnostic.actions) {
    const btn = document.createElement('button');
    btn.className = 'harper-btn';
    btn.textContent = action.name;
    btn.onmousedown = (e) => e.preventDefault();
    btn.onclick = (e) => {
      e.stopPropagation();
      if (callbacks.guard && !callbacks.guard(container)) return;
      const current = findDiagnostic(view, diagnostic);
      if (!current) return;
      action.apply(view, current.from, current.to);
      callbacks.onApply?.(container);
    };
    actions.appendChild(btn);
  }

  if (callbacks.showIgnore !== false) {
    const ignore = document.createElement('button');
    ignore.className = 'harper-ignore';
    ignore.textContent = 'Ignore';
    ignore.onmousedown = (e) => e.preventDefault();
    ignore.onclick = (e) => {
      e.stopPropagation();
      if (callbacks.guard && !callbacks.guard(container)) return;
      callbacks.onIgnore?.(container, diagnostic);
    };
    actions.appendChild(ignore);
  }

  container.appendChild(actions);
}

// ─── Shared base CSS ──────────────────────────────────────────────────────────

/** Shared base CSS for card content elements used by both tooltip and pane. */
export function cardContentCSS(): string {
  let css = `
.harper-msg { line-height: 1.5; }
.harper-msg p { margin: 0; }
.harper-msg code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  border-radius: 4px;
  color: var(--harper-kind-color, #24292f);
  background: color-mix(in srgb, var(--harper-kind-color, ${fallback}) 10%, transparent);
}
.harper-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.harper-btn {
  border: 1px solid #d0d7de;
  border-radius: 6px;
  background: #f6f8fa;
  color: #24292f;
  cursor: pointer;
  font-weight: 500;
  font-family: inherit;
  line-height: 1.4;
  transition: background 0.15s, border-color 0.15s;
}
.harper-btn:hover {
  background: #eaeef2;
  border-color: #afb8c1;
}
.harper-btn:active {
  background: #d8dee4;
}
.harper-ignore {
  border: 1px solid #c0c0c0;
  border-radius: 6px;
  background: transparent;
  color: #555;
  cursor: pointer;
  font-weight: 400;
  font-family: inherit;
  line-height: 1.4;
  margin-left: auto;
  transition: background 0.15s, border-color 0.15s;
}
.harper-ignore:hover { background: rgba(0, 0, 0, 0.05); border-color: #999; }
.harper-ignore:active { background: rgba(0, 0, 0, 0.08); }
`;

  css += `
@media (prefers-color-scheme: dark) {
  .harper-msg code {
    color: var(--harper-kind-color-dark, #f0f0f0);
    background: color-mix(in srgb, var(--harper-kind-color-dark, ${fallbackDark}) 15%, transparent);
  }
  .harper-btn {
    border-color: #464a4f;
    background: #323639;
    color: #e2e4e8;
  }
  .harper-btn:hover {
    background: #3a3e42;
    border-color: #525659;
  }
  .harper-btn:active { background: #42464a; }
  .harper-ignore {
    border-color: #555;
    color: #bbb;
  }
  .harper-ignore:hover { background: rgba(255, 255, 255, 0.08); border-color: #666; }
  .harper-ignore:active { background: rgba(255, 255, 255, 0.12); }
}
`;

  return css;
}

/** Inject the shared card content CSS once. */
export function injectCardCSS() {
  injectStyleSheet('harper-card-base-styles', cardContentCSS());
}
