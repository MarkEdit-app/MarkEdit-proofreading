import { ViewPlugin } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { diagnosticsField, setDiagnosticsEffect, lintToDiagnostic } from './decoration';
import { lintTooltip } from './tooltip';
import { baseTheme } from './styling';
import { lint } from './lint';

const lintDelay = 500;

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

    if (this.view.state.doc !== doc) {
      return;
    }

    this.view.dispatch({ effects: setDiagnosticsEffect.of(lints.map(lintToDiagnostic)) });
  }

  destroy() {
    clearTimeout(this.timeout);
  }
});

export function proofreadingExtension(): Extension {
  return [diagnosticsField, lintScheduler, lintTooltip, baseTheme];
}
