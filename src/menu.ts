import { MarkEdit } from 'markedit-api';
import type { MenuItem } from 'markedit-api';
import { setDiagnosticsEffect, lintToDiagnostic } from './decoration';
import { lint } from './lint';
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
        title: 'Ignore All',
        action: ignoreAll,
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
  const text = view.state.doc.toString();
  const lints = await lint(text);
  view.dispatch({ effects: setDiagnosticsEffect.of(lints.map(lintToDiagnostic)) });
}

function ignoreAll() {
  MarkEdit.editorView.dispatch({ effects: setDiagnosticsEffect.of([]) });
}
