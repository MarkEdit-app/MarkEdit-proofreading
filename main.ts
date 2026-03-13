import { EditorView } from '@codemirror/view';
import { MarkEdit } from 'markedit-api';
import { lint } from './src/lint';
import { diagnosticsField, setDiagnostics } from './src/decorations';
import { tooltipField } from './src/tooltip';
import { styles } from './src/styles';

const debounceDelay = 500;
const debounceTimers = new WeakMap<EditorView, ReturnType<typeof setTimeout>>();

function scheduleLint(view: EditorView) {
  clearTimeout(debounceTimers.get(view));
  debounceTimers.set(view, setTimeout(async () => {
    const text = view.state.doc.toString();
    const diagnostics = await lint(text);
    view.dispatch({ effects: setDiagnostics.of(diagnostics) });
  }, debounceDelay));
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
  lintOnUpdate,
  styles,
]);
