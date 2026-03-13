import { EditorView } from '@codemirror/view';
import { MarkEdit } from 'markedit-api';
import { lint } from './src/lint';
import { diagnosticsField, setDiagnostics } from './src/decorations';
import { tooltipField, dismissTooltipOnEdit } from './src/tooltip';
import { styles } from './src/styles';

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
const debounceDelay = 500;

function scheduleLint(view: EditorView) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const text = view.state.doc.toString();
    const diagnostics = await lint(text);
    view.dispatch({ effects: setDiagnostics.of(diagnostics) });
  }, debounceDelay);
}

const lintOnUpdate = EditorView.updateListener.of(update => {
  if (update.docChanged) {
    scheduleLint(update.view);
  }
});

MarkEdit.onEditorReady(editorView => {
  scheduleLint(editorView);
});

MarkEdit.addExtension([
  diagnosticsField,
  tooltipField,
  dismissTooltipOnEdit,
  lintOnUpdate,
  styles,
]);
