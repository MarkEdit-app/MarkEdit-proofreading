import { StateField, StateEffect } from '@codemirror/state';
import { showTooltip, EditorView } from '@codemirror/view';
import type { Tooltip } from '@codemirror/view';
import { diagnosticsField } from './decoration';
import type { Diagnostic } from './decoration';
import { lintKindColor } from './styling';

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
            return createTooltipDOM(view, diagnostic);
          },
        };
      }
    }

    return value;
  },
  provide: f => showTooltip.from(f),
});

export const tooltipHandlers = EditorView.domEventHandlers({
  mouseup(event, view) {
    const target = event.target as HTMLElement;
    if (target.closest('.cm-tooltip')) return false;

    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos === null) {
      if (view.state.field(clickTooltipField) !== null) {
        view.dispatch({ effects: setClickTooltip.of(null) });
      }
      return false;
    }

    const { diagnostics } = view.state.field(diagnosticsField);
    const found = diagnostics.find(d => pos >= d.from && pos <= d.to);

    if (found) {
      view.dispatch({ effects: setClickTooltip.of(found) });
    } else if (view.state.field(clickTooltipField) !== null) {
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

function createTooltipDOM(view: EditorView, diagnostic: Diagnostic) {
  const dom = document.createElement('div');
  dom.className = 'cm-harper-tooltip';

  const header = document.createElement('div');
  header.className = 'cm-harper-header';

  const badge = document.createElement('span');
  badge.className = 'cm-harper-badge';
  const color = lintKindColor(diagnostic.lintKind);
  badge.style.backgroundColor = `${color}22`;
  badge.style.color = color;
  badge.textContent = diagnostic.title;
  header.appendChild(badge);
  dom.appendChild(header);

  const message = document.createElement('div');
  message.className = 'cm-harper-message';
  message.textContent = diagnostic.message;
  dom.appendChild(message);

  if (diagnostic.actions.length > 0) {
    const actions = document.createElement('div');
    actions.className = 'cm-harper-actions';

    for (const action of diagnostic.actions) {
      const button = document.createElement('button');
      button.className = 'cm-harper-action';
      button.textContent = action.name;
      button.onmousedown = (e) => {
        e.preventDefault();
        const current = view.state.field(diagnosticsField).diagnostics.find(d =>
          d.from === diagnostic.from && d.to === diagnostic.to,
        );
        if (current) {
          action.apply(view, current.from, current.to);
        }
      };
      actions.appendChild(button);
    }

    dom.appendChild(actions);
  }

  return {
    dom,
    mount() {
      const parent = dom.parentElement;
      if (parent) {
        parent.classList.add('cm-harper-card');
      }
    },
  };
}
