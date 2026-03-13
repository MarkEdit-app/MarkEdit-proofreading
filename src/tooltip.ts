import { EditorView, showTooltip, type Tooltip } from '@codemirror/view';
import { StateField } from '@codemirror/state';
import { SuggestionKind } from 'harper.js';
import { diagnosticsField, setDiagnostics } from './decorations';
import type { Diagnostic } from './lint';

function createTooltipContent(view: EditorView, diagnostic: Diagnostic): HTMLElement {
  const container = document.createElement('div');
  container.className = 'cm-harper-tooltip';

  const message = document.createElement('div');
  message.className = 'cm-harper-tooltip-message';
  message.textContent = diagnostic.message;
  container.appendChild(message);

  const suggestions = diagnostic.lint.suggestions();
  if (suggestions.length > 0) {
    const list = document.createElement('div');
    list.className = 'cm-harper-tooltip-suggestions';

    for (const suggestion of suggestions) {
      const button = document.createElement('button');
      button.className = 'cm-harper-tooltip-button';
      const kind = suggestion.kind();

      if (kind === SuggestionKind.Remove) {
        button.textContent = 'Remove';
      } else {
        const text = suggestion.get_replacement_text();
        button.textContent = text || 'Remove';
      }

      button.addEventListener('click', () => {
        view.dispatch({
          changes: { from: diagnostic.from, to: diagnostic.to, insert: suggestion.get_replacement_text() },
        });
      });

      list.appendChild(button);
    }

    container.appendChild(list);
  }

  return container;
}

export const tooltipField = StateField.define<Tooltip | null>({
  create() {
    return null;
  },
  update(_tooltip, tr) {
    if (!tr.selection) {
      return _tooltip;
    }

    const { diagnostics } = tr.state.field(diagnosticsField);
    if (diagnostics.length === 0) {
      return null;
    }

    const pos = tr.state.selection.main.head;
    const match = diagnostics.find(d => pos >= d.from && pos <= d.to);

    if (!match) {
      return null;
    }

    return {
      pos: match.from,
      above: true,
      strictSide: true,
      arrow: true,
      create(view: EditorView) {
        return { dom: createTooltipContent(view, match) };
      },
    };
  },
  provide(field) {
    return showTooltip.from(field);
  },
});

export const dismissTooltipOnEdit = EditorView.updateListener.of(update => {
  if (update.docChanged) {
    const { diagnostics } = update.state.field(diagnosticsField);
    if (diagnostics.length === 0) {
      update.view.dispatch({ effects: setDiagnostics.of([]) });
    }
  }
});
