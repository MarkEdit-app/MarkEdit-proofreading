import { ViewPlugin } from '@codemirror/view';
import type { ViewUpdate } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { MarkEdit } from 'markedit-api';
import { diagnosticsField, setDiagnosticsEffect, lintToDiagnostic } from './decoration';
import { clickTooltipField, tooltipHandlers } from './tooltip';
import { panelExtension } from './panel';
import { baseTheme, kindCSS } from './styling';
import { lint } from './lint';
import { getProofreadingSettings } from './settings';

const { autoLintDelay } = getProofreadingSettings(MarkEdit.userSettings);

const kindStyleInjector = ViewPlugin.define(() => {
  if (!document.getElementById('harper-kind-styles')) {
    const style = document.createElement('style');
    style.id = 'harper-kind-styles';
    style.textContent = kindCSS();
    document.head.appendChild(style);
  }
  return {};
});

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
    this.timeout = setTimeout(() => { void this.runLint(); }, autoLintDelay);
  }

  async runLint() {
    const doc = this.view.state.doc;
    const text = doc.toString();
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
  const extensions: Extension[] = [diagnosticsField, clickTooltipField, tooltipHandlers, panelExtension, baseTheme, kindStyleInjector];

  if (autoLintDelay !== -1) {
    extensions.push(lintScheduler);
  }

  return extensions;
}
