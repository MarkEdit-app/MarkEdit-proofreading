import { describe, expect, it, vi } from 'vitest';
import { Lint, SuggestionKind } from 'harper.js';
import { lintToDiagnostic } from '../src/decoration';
import { EditorView } from '@codemirror/view';

function makeSuggestion(kind: SuggestionKind, replacement: string) {
  return {
    kind: () => kind,
    get_replacement_text: () => replacement,
  };
}

describe('lintToDiagnostic', () => {
  it('maps lint fields and creates action labels', () => {
    const lint = {
      span: () => ({ start: 1, end: 5 }),
      lint_kind: () => 'Style',
      lint_kind_pretty: () => 'Style',
      message_html: () => '<p>Use another word</p>',
      get_problem_text: () => 'word',
      suggestions: () => [
        makeSuggestion(SuggestionKind.Remove, ''),
        makeSuggestion(SuggestionKind.InsertAfter, 'ed'),
        makeSuggestion(SuggestionKind.Replace, 'fixed'),
      ],
    };

    const diagnostic = lintToDiagnostic(lint as Lint);

    expect(diagnostic).toMatchObject({
      from: 1,
      to: 5,
      lintKind: 'Style',
      title: 'Style',
      messageHtml: '<p>Use another word</p>',
      problemText: 'word',
    });

    expect(diagnostic.actions.map(a => a.name)).toEqual(['Remove', 'Insert "ed"', 'fixed']);
  });

  it('applies remove, replace, and insert-after actions with correct edits', () => {
    const lint = {
      span: () => ({ start: 2, end: 6 }),
      lint_kind: () => 'Typo',
      lint_kind_pretty: () => 'Typo',
      message_html: () => '<p>Typo</p>',
      get_problem_text: () => 'typo',
      suggestions: () => [
        makeSuggestion(SuggestionKind.Remove, ''),
        makeSuggestion(SuggestionKind.Replace, 'word'),
        makeSuggestion(SuggestionKind.InsertAfter, '!'),
      ],
    };

    const diagnostic = lintToDiagnostic(lint as Lint);
    const dispatch = vi.fn();
    const view = { dispatch } as unknown as EditorView;

    diagnostic.actions[0].apply(view, 2, 6);
    diagnostic.actions[1].apply(view, 2, 6);
    diagnostic.actions[2].apply(view, 2, 6);

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      changes: { from: 2, to: 6, insert: '' },
      selection: { anchor: 2 },
    });

    expect(dispatch).toHaveBeenNthCalledWith(2, {
      changes: { from: 2, to: 6, insert: 'word' },
      selection: { anchor: 6 },
    });

    expect(dispatch).toHaveBeenNthCalledWith(3, {
      changes: { from: 6, to: 6, insert: '!' },
      selection: { anchor: 7 },
    });
  });
});
