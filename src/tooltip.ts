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
  const isDark = view.state.facet(EditorView.darkTheme);
  const color = colorForKind(diagnostic.lintKind);

  const dom = document.createElement('div');
  dom.style.cssText = `
    border-radius: 10px;
    overflow: hidden;
    max-width: 360px;
    min-width: 180px;
    margin: 0 6px 6px 6px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    background: ${isDark ? 'rgba(40, 40, 40, 0.82)' : 'rgba(255, 255, 255, 0.85)'};
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    border: 0.5px solid ${isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.15)'};
    box-shadow: ${isDark
      ? '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.2)'
      : '0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)'};
  `;

  const content = document.createElement('div');
  content.style.padding = '12px 14px';

  const badge = document.createElement('span');
  badge.style.cssText = `
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2px;
    margin-bottom: 6px;
    background-color: ${color}22;
    color: ${color};
  `;
  badge.textContent = diagnostic.title;
  content.appendChild(badge);

  const msg = document.createElement('div');
  msg.style.cssText = `
    font-size: 13px;
    line-height: 1.5;
    color: ${isDark ? '#aaaaaa' : '#444444'};
    margin-bottom: 10px;
  `;
  msg.textContent = diagnostic.message;
  content.appendChild(msg);

  if (diagnostic.actions.length > 0) {
    const actions = document.createElement('div');
    actions.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px;';

    for (const action of diagnostic.actions) {
      const btn = document.createElement('button');
      btn.style.cssText = buttonStyle(isDark);
      btn.textContent = action.name;
      btn.onmousedown = (e) => {
        e.preventDefault();
        const current = view.state.field(diagnosticsField).diagnostics.find(d =>
          d.from === diagnostic.from && d.to === diagnostic.to,
        );
        if (current) {
          action.apply(view, current.from, current.to);
        }
      };
      btn.onmouseenter = () => {
        btn.style.background = isDark ? '#404850' : '#eaeef2';
        btn.style.borderColor = isDark ? '#5a6570' : '#afb8c1';
      };
      btn.onmouseleave = () => {
        btn.style.cssText = buttonStyle(isDark);
      };
      actions.appendChild(btn);
    }

    content.appendChild(actions);
  }

  dom.appendChild(content);

  return {
    dom,
    mount() {
      const wrapper = dom.closest('.cm-tooltip') as HTMLElement | null;
      if (wrapper) {
        wrapper.style.background = 'transparent';
        wrapper.style.border = 'none';
        wrapper.style.padding = '0';
      }
    },
  };
}

function buttonStyle(isDark: boolean): string {
  return `
    padding: 4px 12px;
    border: 1px solid ${isDark ? '#505860' : '#d0d7de'};
    border-radius: 6px;
    background: ${isDark ? '#343a44' : '#f6f8fa'};
    color: ${isDark ? '#c9d1d9' : '#24292f'};
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    font-family: inherit;
    line-height: 1.4;
  `;
}
