import { describe, expect, it, vi } from 'vitest';
import { tooltipCSS, tooltipHandlers } from '../src/tooltip';

describe('tooltipCSS', () => {
  it('keeps tooltip content padding styles for the inset card layout', () => {
    const css = tooltipCSS;
    expect(css).toContain('.harper-card .harper-content');
    expect(css).toContain('padding: 12px;');
  });
});

// EditorView.domEventHandlers wraps the handler map in a Facet extension.
// Walk the object tree to find the { mousedown, mouseup } handler map.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findHandlers(obj: any, depth = 0): any {
  if (!obj || depth > 5) return null;
  if (typeof obj.mousedown === 'function' && typeof obj.mouseup === 'function') return obj;
  for (const key of Object.keys(obj)) {
    const found = findHandlers(obj[key], depth + 1);
    if (found) return found;
  }
  return null;
}

const handlers = findHandlers(tooltipHandlers) as {
  mousedown: (event: MouseEvent) => boolean;
  mouseup: (event: MouseEvent, view: unknown) => boolean;
} | null;

function fakeTarget(selectors: string[]) {
  return { closest: (sel: string) => selectors.includes(sel) ? {} : null };
}

function fakeEvent(detail: number, target: unknown) {
  return { detail, target, preventDefault: vi.fn() } as unknown as MouseEvent;
}

describe('tooltipHandlers', () => {
  it('handler map is accessible', () => {
    expect(handlers).not.toBeNull();
  });

  describe('mousedown', () => {
    it('prevents default on single click on a flagged word', () => {
      const event = fakeEvent(1, fakeTarget(['.cm-harper-lint']));
      const handled = handlers!.mousedown(event);

      expect(handled).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('does not prevent default on double-click on a flagged word', () => {
      const event = fakeEvent(2, fakeTarget(['.cm-harper-lint']));
      const handled = handlers!.mousedown(event);

      expect(handled).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('does not prevent default on triple-click on a flagged word', () => {
      const event = fakeEvent(3, fakeTarget(['.cm-harper-lint']));
      const handled = handlers!.mousedown(event);

      expect(handled).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('ignores clicks outside flagged words', () => {
      const event = fakeEvent(1, fakeTarget([]));
      const handled = handlers!.mousedown(event);

      expect(handled).toBe(false);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});
