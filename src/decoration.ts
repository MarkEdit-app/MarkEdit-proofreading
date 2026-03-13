import { EditorView, Decoration } from '@codemirror/view';
import type { DecorationSet } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { SuggestionKind } from 'harper.js';
import type { Lint, Suggestion } from 'harper.js';

export interface Diagnostic {
  from: number;
  to: number;
  lintKind: string;
  title: string;
  message: string;
  actions: DiagnosticAction[];
}

export interface DiagnosticAction {
  name: string;
  apply: (view: EditorView, from: number, to: number) => void;
}

export const setDiagnosticsEffect = StateEffect.define<Diagnostic[]>();

export const diagnosticsField = StateField.define<{ diagnostics: Diagnostic[]; decorations: DecorationSet }>({
  create() {
    return { diagnostics: [], decorations: Decoration.none };
  },
  update(value, tr) {
    if (tr.docChanged && value.decorations !== Decoration.none) {
      value = { diagnostics: value.diagnostics, decorations: value.decorations.map(tr.changes) };
    }

    for (const effect of tr.effects) {
      if (effect.is(setDiagnosticsEffect)) {
        const diagnostics = effect.value;
        const ranges = diagnostics
          .filter(d => d.from < d.to)
          .map(d => {
            return Decoration.mark({
              class: 'cm-harper-lint',
              attributes: { 'data-lint-kind': d.lintKind },
            }).range(d.from, d.to);
          });

        value = { diagnostics, decorations: Decoration.set(ranges, true) };
      }
    }

    return value;
  },
  provide: f => EditorView.decorations.from(f, val => val.decorations),
});

export function lintToDiagnostic(l: Lint): Diagnostic {
  const span = l.span();

  return {
    from: span.start,
    to: span.end,
    lintKind: l.lint_kind(),
    title: l.lint_kind_pretty(),
    message: l.message(),
    actions: l.suggestions().map(suggestionToAction),
  };
}

function suggestionToAction(sug: Suggestion): DiagnosticAction {
  const kind = sug.kind();
  const replacement = sug.get_replacement_text();

  let name: string;
  if (kind === SuggestionKind.Remove) {
    name = 'Remove';
  } else if (kind === SuggestionKind.InsertAfter) {
    name = `Insert "${replacement}"`;
  } else {
    name = replacement;
  }

  return {
    name,
    apply(view, from, to) {
      if (kind === SuggestionKind.Remove) {
        view.dispatch({ changes: { from, to, insert: '' }, selection: { anchor: from } });
      } else if (kind === SuggestionKind.Replace) {
        view.dispatch({ changes: { from, to, insert: replacement }, selection: { anchor: from + replacement.length } });
      } else if (kind === SuggestionKind.InsertAfter) {
        view.dispatch({ changes: { from: to, to, insert: replacement }, selection: { anchor: to + replacement.length } });
      }
    },
  };
}
