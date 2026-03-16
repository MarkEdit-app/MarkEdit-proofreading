import { describe, expect, it, vi } from 'vitest';
import { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { diagnosticsField, setDiagnosticsEffect } from '../src/decoration';
import type { Diagnostic } from '../src/decoration';

vi.mock('../src/lint', () => ({
  shouldAddToDict: false,
  addToDictionary: vi.fn(),
}));

// Import after mock so the module picks up the mocked lint
const { cardContentCSS, ignoreDiagnostic } = await import('../src/card');

function makeDiag(overrides: Partial<Diagnostic> & { from: number; to: number }): Diagnostic {
  return {
    lintKind: 'Spelling',
    title: 'Spelling',
    messageHtml: '<p>Unknown word</p>',
    problemText: 'MarkEdit',
    actions: [],
    ...overrides,
  };
}

function createMockView(diagnostics: Diagnostic[]) {
  const state = EditorState.create({ extensions: [diagnosticsField] })
    .update({ effects: setDiagnosticsEffect.of(diagnostics) }).state;

  let dispatched: Diagnostic[] | undefined;
  const view = {
    state,
    dispatch(tr: { effects: unknown[] }) {
      for (const e of tr.effects) {
        if ((e as { is: (t: unknown) => boolean }).is(setDiagnosticsEffect)) {
          dispatched = (e as { value: Diagnostic[] }).value;
        }
      }
    },
  } as unknown as EditorView;

  return { view, getDispatched: () => dispatched };
}

describe('ignoreDiagnostic', () => {
  it('removes all diagnostics with the same problemText', () => {
    const d1 = makeDiag({ from: 0, to: 8 });
    const d2 = makeDiag({ from: 20, to: 28 });
    const d3 = makeDiag({ from: 40, to: 48 });
    const { view, getDispatched } = createMockView([d1, d2, d3]);

    ignoreDiagnostic(view, d1);
    expect(getDispatched()).toHaveLength(0);
  });

  it('removes same problemText across different lintKinds', () => {
    const d1 = makeDiag({ from: 0, to: 8, lintKind: 'Spelling' });
    const d2 = makeDiag({ from: 20, to: 28, lintKind: 'Style' });
    const { view, getDispatched } = createMockView([d1, d2]);

    ignoreDiagnostic(view, d1);
    expect(getDispatched()).toHaveLength(0);
  });

  it('keeps diagnostics with different problemText', () => {
    const d1 = makeDiag({ from: 0, to: 8, problemText: 'MarkEdit' });
    const d2 = makeDiag({ from: 20, to: 25, problemText: 'other' });
    const { view, getDispatched } = createMockView([d1, d2]);

    ignoreDiagnostic(view, d1);
    const remaining = getDispatched()!;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].problemText).toBe('other');
  });

  it('falls back to positional match when problemText is empty', () => {
    const d1 = makeDiag({ from: 0, to: 5, problemText: '', lintKind: 'Grammar' });
    const d2 = makeDiag({ from: 10, to: 15, problemText: '', lintKind: 'Grammar' });
    const { view, getDispatched } = createMockView([d1, d2]);

    ignoreDiagnostic(view, d1);
    const remaining = getDispatched()!;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].from).toBe(10);
  });
});

describe('cardContentCSS', () => {
  it('includes message, button, ignore, and actions styles', () => {
    const css = cardContentCSS();
    expect(css).toContain('.harper-msg');
    expect(css).toContain('.harper-btn');
    expect(css).toContain('.harper-ignore');
    expect(css).toContain('.harper-actions');
  });

  it('uses CSS custom properties for accent-colored code', () => {
    const css = cardContentCSS();
    expect(css).toMatch(/\.harper-msg\s+code\s*\{[^}]*var\(--harper-kind-color/);
    expect(css).toMatch(/\.harper-msg\s+code\s*\{[^}]*color-mix/);
  });

  it('includes hover and active states for buttons', () => {
    const css = cardContentCSS();
    expect(css).toContain('.harper-btn:hover');
    expect(css).toContain('.harper-btn:active');
    expect(css).toContain('.harper-ignore:hover');
    expect(css).toContain('.harper-ignore:active');
  });

  it('includes dark mode overrides', () => {
    const css = cardContentCSS();
    expect(css).toContain('@media (prefers-color-scheme: dark)');
  });

  it('styles ignore button with transparent background and auto margin', () => {
    const css = cardContentCSS();
    expect(css).toMatch(/\.harper-ignore\s*\{[^}]*background:\s*transparent/);
    expect(css).toMatch(/\.harper-ignore\s*\{[^}]*margin-left:\s*auto/);
  });
});
