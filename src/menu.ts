import { MarkEdit } from 'markedit-api';
import type { MenuItem } from 'markedit-api';
import { setDiagnosticsEffect, lintToDiagnostic } from './decoration';
import { lint } from './lint';

const repoUrl = 'https://github.com/MarkEdit-app/MarkEdit-proofreading';

export function buildMenuItems(): MenuItem[] {
  return [
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
      title: 'Check Release (GitHub)',
      action: () => open(`${repoUrl}/releases`),
    },
  ];
}

export function addMenuItems() {
  MarkEdit.addMainMenuItem(buildMenuItems());
}

async function proofreadNow() {
  const view = MarkEdit.editorView;
  const doc = view.state.doc;
  const text = doc.sliceString(0);
  const lints = await lint(text);

  if (view.state.doc !== doc) {
    return;
  }

  view.dispatch({ effects: setDiagnosticsEffect.of(lints.map(lintToDiagnostic)) });
}

function ignoreAll() {
  MarkEdit.editorView.dispatch({ effects: setDiagnosticsEffect.of([]) });
}
