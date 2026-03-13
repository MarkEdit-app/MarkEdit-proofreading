import { StateField, StateEffect } from '@codemirror/state';
import { showTooltip, EditorView } from '@codemirror/view';
import type { Tooltip } from '@codemirror/view';
import { diagnosticsField } from './decoration';
import type { Diagnostic } from './decoration';
import { colorForKind } from './styling';

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
  mousedown(event, view) {
    const target = event.target as HTMLElement;
    if (target.closest('.cm-tooltip')) return false;

    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos === null) return false;

    const { diagnostics } = view.state.field(diagnosticsField);
    const found = diagnostics.find(d => pos >= d.from && pos <= d.to);

    if (found) {
      event.preventDefault();
      return true;
    }

    return false;
  },
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
      return true;
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

function createTooltip(view: EditorView, diagnostic: Diagnostic) {
  const dom = document.createElement('div');
  dom.className = 'cm-harper-tooltip';

  const header = document.createElement('div');
  header.className = 'cm-harper-header';

  const badge = document.createElement('span');
  badge.className = 'cm-harper-badge';
  const color = colorForKind(diagnostic.lintKind);
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
      if (!parent) return;

      parent.classList.add('cm-harper-card');
      const isDark = view.state.facet(EditorView.darkTheme);

      parent.style.cssText = `
        border-radius: 10px;
        overflow: hidden;
        padding: 0;
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
        background: ${isDark ? 'rgba(40,40,40,0.82)' : 'rgba(255,255,255,0.85)'};
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: ${isDark
          ? '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2)'
          : '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)'};
      `;
    },
  };
}
