import { MarkEdit } from 'markedit-api';
import type { MenuItem } from 'markedit-api';
import { setDiagnosticsEffect, lintToDiagnostic } from './decoration';
import { lint, resetDictionary } from './lint';
import { togglePanelEffect } from './panel';
import { setClickTooltip } from './tooltip';
import { repoUrl } from './const';

export function buildMenuItem(): MenuItem {
  return {
    title: 'Proofread',
    icon: 'text.badge.checkmark',
    children: [
      {
        title: 'Proofread Now',
        action: proofreadNow,
      },
      {
        title: 'Review Problems',
        action: reviewProblems,
      },
      { separator: true },
      {
        title: 'Ignore All',
        action: ignoreAll,
      },
      {
        title: 'Reset Dictionary',
        action: async () => {
          const result = await MarkEdit.showAlert({
            title: 'Are you sure you want to reset the dictionary?',
            message: 'All custom words you have added will be removed. This action cannot be undone.',
            buttons: ['Reset', 'Cancel'],
          });

          if (result === 0) {
            await resetDictionary();
            await proofreadNow();
          }
        },
      },
      { separator: true },
      {
        title: `Version ${__PKG_VERSION__}`,
        action: () => open(`${repoUrl}/releases/tag/v${__PKG_VERSION__}`),
      },
      {
        title: 'Check Releases (GitHub)',
        action: () => open(`${repoUrl}/releases`),
      },
    ],
  };
}

async function proofreadNow() {
  const view = MarkEdit.editorView;
  const doc = view.state.doc;
  const text = doc.toString();
  const lints = await lint(text);

  // Bail out if the document changed during linting
  if (view.state.doc !== doc) return;

  view.dispatch({ effects: setDiagnosticsEffect.of(lints.map(lintToDiagnostic)) });
}

function ignoreAll() {
  MarkEdit.editorView.dispatch({ effects: setDiagnosticsEffect.of([]) });
}

async function reviewProblems() {
  const view = MarkEdit.editorView;
  const doc = view.state.doc;
  const text = doc.toString();
  const lints = await lint(text);

  // Bail out if the document changed during linting
  if (view.state.doc !== doc) return;

  view.dispatch({
    effects: [
      setClickTooltip.of(null),
      setDiagnosticsEffect.of(lints.map(lintToDiagnostic)),
      togglePanelEffect.of(true),
    ],
  });
}
