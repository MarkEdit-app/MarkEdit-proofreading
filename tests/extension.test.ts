import { describe, expect, it, vi } from 'vitest';
import { ensureNativeSpellcheckDisabled } from '../src/extension';

describe('ensureNativeSpellcheckDisabled', () => {
  it('sets spellcheck=false when it is not already disabled', () => {
    const getAttribute: Pick<HTMLElement, 'getAttribute'>['getAttribute'] = vi.fn(() => null);
    const setAttribute: Pick<HTMLElement, 'setAttribute'>['setAttribute'] = vi.fn();
    const editorDom: Pick<HTMLElement, 'getAttribute' | 'setAttribute'> = {
      getAttribute,
      setAttribute,
    };

    ensureNativeSpellcheckDisabled(editorDom);

    expect(setAttribute).toHaveBeenCalledWith('spellcheck', 'false');
  });

  it('does not write spellcheck attribute when already false', () => {
    const getAttribute: Pick<HTMLElement, 'getAttribute'>['getAttribute'] = vi.fn(() => 'false');
    const setAttribute: Pick<HTMLElement, 'setAttribute'>['setAttribute'] = vi.fn();
    const editorDom: Pick<HTMLElement, 'getAttribute' | 'setAttribute'> = {
      getAttribute,
      setAttribute,
    };

    ensureNativeSpellcheckDisabled(editorDom);

    expect(setAttribute).not.toHaveBeenCalled();
  });
});
