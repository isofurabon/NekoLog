import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClickOutside } from './useClickOutside.ts';

describe('useClickOutside', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should call callback when clicking outside', () => {
        const callback = vi.fn();
        const element = document.createElement('div');
        document.body.appendChild(element);
        const ref = { current: element };

        renderHook(() => useClickOutside(ref, callback));

        // Click outside
        const event = new MouseEvent('mousedown', { bubbles: true });
        document.dispatchEvent(event);

        expect(callback).toHaveBeenCalledTimes(1);
        document.body.removeChild(element);
    });

    it('should not call callback when clicking inside', () => {
        const callback = vi.fn();
        const element = document.createElement('div');
        document.body.appendChild(element);
        const ref = { current: element };

        renderHook(() => useClickOutside(ref, callback));

        // Click inside
        const event = new MouseEvent('mousedown', { bubbles: true });
        element.dispatchEvent(event);

        expect(callback).not.toHaveBeenCalled();
        document.body.removeChild(element);
    });

    it('should not call callback when disabled', () => {
        const callback = vi.fn();
        const element = document.createElement('div');
        document.body.appendChild(element);
        const ref = { current: element };

        renderHook(() => useClickOutside(ref, callback, false));

        // Click outside
        const event = new MouseEvent('mousedown', { bubbles: true });
        document.dispatchEvent(event);

        expect(callback).not.toHaveBeenCalled();
        document.body.removeChild(element);
    });

    it('should cleanup event listener on unmount', () => {
        const removeSpy = vi.spyOn(document, 'removeEventListener');
        const callback = vi.fn();
        const element = document.createElement('div');
        const ref = { current: element };

        const { unmount } = renderHook(() => useClickOutside(ref, callback));

        unmount();

        expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
        removeSpy.mockRestore();
    });

    it('should update listener when callback or enabled changes', () => {
        const addSpy = vi.spyOn(document, 'addEventListener');
        const removeSpy = vi.spyOn(document, 'removeEventListener');
        const callback1 = vi.fn();
        const callback2 = vi.fn();
        const element = document.createElement('div');
        const ref = { current: element };

        const { rerender } = renderHook(
            ({ cb, enabled }) => useClickOutside(ref, cb, enabled),
            { initialProps: { cb: callback1, enabled: true } }
        );

        expect(addSpy).toHaveBeenCalledTimes(1);

        // Change callback
        rerender({ cb: callback2, enabled: true });

        // Should have removed old and added new listener because callback is in the dependency array
        expect(removeSpy).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledTimes(2);

        // Disable
        rerender({ cb: callback2, enabled: false });
        expect(removeSpy).toHaveBeenCalledTimes(2);

        addSpy.mockRestore();
        removeSpy.mockRestore();
    });
});
