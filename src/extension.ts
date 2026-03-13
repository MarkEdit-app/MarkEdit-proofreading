import { EditorView, Decoration, ViewPlugin, hoverTooltip } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { SuggestionKind } from 'harper.js';
import type { Lint, Suggestion } from 'harper.js';
import { lint } from './lint';

// Diagnostic produced from a Harper lint result
interface Diagnostic {
  from: number;
  to: number;
  title: string;
  messageHtml: string;
  actions: DiagnosticAction[];
}

interface DiagnosticAction {
  name: string;
  apply: (view: EditorView, from: number, to: number) => void;
}

// State effect to replace all diagnostics
const setDiagnosticsEffect = StateEffect.define<Diagnostic[]>();

// State field storing current diagnostics and their decorations
const diagnosticsField = StateField.define<{ diagnostics: Diagnostic[]; decorations: DecorationSet }>({
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
          .map(d => Decoration.mark({ class: 'cm-harper-lint', diagnostic: d }).range(d.from, d.to));

        value = { diagnostics, decorations: Decoration.set(ranges, true) };
      }
    }

    return value;
  },
  provide: f => EditorView.decorations.from(f, val => val.decorations),
});

// Debounce delay in milliseconds before re-linting after a document change
const lintDelay = 500;

// View plugin that schedules lint runs on document changes
const lintScheduler = ViewPlugin.fromClass(class {
  private timeout: ReturnType<typeof setTimeout> | undefined;

  constructor(readonly view: EditorView) {
    this.scheduleLint();
  }

  update(update: ViewUpdate) {
    if (update.docChanged) {
      this.scheduleLint();
    }
  }

  scheduleLint() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => { void this.runLint(); }, lintDelay);
  }

  async runLint() {
    const doc = this.view.state.doc;
    const text = doc.sliceString(0);
    const lints = await lint(text);

    // Discard results if the document changed while linting
    if (this.view.state.doc !== doc) {
      return;
    }

    this.view.dispatch({ effects: setDiagnosticsEffect.of(lints.map(lintToDiagnostic)) });
  }

  destroy() {
    clearTimeout(this.timeout);
  }
});

// Convert a Harper Lint into a Diagnostic
function lintToDiagnostic(l: Lint): Diagnostic {
  const span = l.span();

  return {
    from: span.start,
    to: span.end,
    title: l.lint_kind_pretty(),
    messageHtml: l.message_html(),
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

// Hover tooltip that displays diagnostics and suggestions
const lintTooltip = hoverTooltip((view, pos, side) => {
  const { diagnostics } = view.state.field(diagnosticsField);
  const found = diagnostics.filter(d =>
    pos >= d.from && pos <= d.to &&
    (pos > d.from || side > 0) &&
    (pos < d.to || side < 0),
  );

  if (found.length === 0) {
    return null;
  }

  return {
    pos: found[0].from,
    end: found[found.length - 1].to,
    above: true,
    create(tooltipView) {
      const dom = document.createElement('div');
      dom.className = 'cm-harper-tooltip';

      for (const diagnostic of found) {
        const item = document.createElement('div');
        item.className = 'cm-harper-diagnostic';

        const title = document.createElement('div');
        title.className = 'cm-harper-title';
        title.textContent = diagnostic.title;
        item.appendChild(title);

        const message = document.createElement('div');
        message.className = 'cm-harper-message';
        message.innerHTML = diagnostic.messageHtml;
        item.appendChild(message);

        if (diagnostic.actions.length > 0) {
          const actions = document.createElement('div');
          actions.className = 'cm-harper-actions';

          for (const action of diagnostic.actions) {
            const button = document.createElement('button');
            button.className = 'cm-harper-action';
            button.textContent = action.name;
            button.onmousedown = (e) => {
              e.preventDefault();
              const current = view.state.field(diagnosticsField).diagnostics.find(d => d === diagnostic);
              if (current) {
                action.apply(tooltipView, current.from, current.to);
              }
            };
            actions.appendChild(button);
          }

          item.appendChild(actions);
        }

        dom.appendChild(item);
      }

      return { dom };
    },
  };
});

// Base theme for lint decorations and tooltips
const baseTheme = EditorView.baseTheme({
  '.cm-harper-lint': {
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'6\' height=\'3\'%3E%3Cpath d=\'m0 3 l2 -2 l1 0 l2 2 l1 0\' stroke=\'%23d4a017\' fill=\'none\' stroke-width=\'.7\'/%3E%3C/svg%3E")',
    backgroundRepeat: 'repeat-x',
    backgroundPosition: 'bottom',
    paddingBottom: '0.7px',
  },
  '.cm-harper-tooltip': {
    padding: '4px 8px',
    maxWidth: '400px',
  },
  '.cm-harper-diagnostic + .cm-harper-diagnostic': {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #ddd',
  },
  '.cm-harper-title': {
    fontWeight: 'bold',
    marginBottom: '2px',
    fontSize: '13px',
  },
  '.cm-harper-message': {
    fontSize: '12px',
    lineHeight: '1.4',
    marginBottom: '4px',
  },
  '.cm-harper-actions': {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  '.cm-harper-action': {
    padding: '2px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: '#f5f5f5',
    cursor: 'pointer',
    fontSize: '12px',
    '&:hover': {
      background: '#e0e0e0',
    },
  },
  '&dark .cm-harper-diagnostic + .cm-harper-diagnostic': {
    borderTopColor: '#444',
  },
  '&dark .cm-harper-action': {
    borderColor: '#555',
    background: '#333',
    color: '#eee',
    '&:hover': {
      background: '#444',
    },
  },
});

// Public extension to add to the editor
export function proofreadingExtension(): Extension {
  return [diagnosticsField, lintScheduler, lintTooltip, baseTheme];
}
