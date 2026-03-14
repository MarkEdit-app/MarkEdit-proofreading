import { describe, expect, it, vi } from 'vitest';
import { disableNativeSpellcheck } from '../src/extension';

describe('disableNativeSpellcheck', () => {
  it('sets spellcheck=false when it is not already disabled', () => {
    const editorDom = {
      getAttribute: vi.fn(() => null),
      setAttribute: vi.fn(),
    };

    disableNativeSpellcheck(editorDom);

    expect(editorDom.setAttribute).toHaveBeenCalledWith('spellcheck', 'false');
  });

  it('does not write spellcheck attribute when already false', () => {
    const editorDom = {
      getAttribute: vi.fn(() => 'false'),
      setAttribute: vi.fn(),
    };

    disableNativeSpellcheck(editorDom);

    expect(editorDom.setAttribute).not.toHaveBeenCalled();
  });
});
