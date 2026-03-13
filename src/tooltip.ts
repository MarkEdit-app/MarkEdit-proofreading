import { hoverTooltip } from '@codemirror/view';
import { diagnosticsField } from './decoration';

export const lintTooltip = hoverTooltip((view, pos, side) => {
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
        message.textContent = diagnostic.message;
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
