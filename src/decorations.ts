import { EditorView, Decoration, type DecorationSet } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import type { Diagnostic } from './lint';

export const setDiagnostics = StateEffect.define<Diagnostic[]>();

const markDecoration = Decoration.mark({ class: 'cm-harper-lint' });

export const diagnosticsField = StateField.define<{ decorations: DecorationSet; diagnostics: Diagnostic[] }>({
  create() {
    return { decorations: Decoration.none, diagnostics: [] };
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setDiagnostics)) {
        const diagnostics = effect.value;
        const ranges = diagnostics
          .filter(d => d.from < d.to && d.to <= tr.state.doc.length)
          .sort((a, b) => a.from - b.from || a.to - b.to)
          .map(d => markDecoration.range(d.from, d.to));
        return {
          decorations: Decoration.set(ranges),
          diagnostics,
        };
      }
    }

    if (tr.docChanged) {
      return { decorations: value.decorations.map(tr.changes), diagnostics: [] };
    }

    return value;
  },
  provide(field) {
    return EditorView.decorations.from(field, value => value.decorations);
  },
});
