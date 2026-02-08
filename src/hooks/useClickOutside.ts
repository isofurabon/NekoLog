import { useEffect, type RefObject } from 'react';

/**
 * Hook to detect clicks outside of a specified element.
 * @param ref - Reference to the element to monitor
 * @param callback - Function to call when a click outside is detected
 * @param enabled - Whether the hook is active (default: true)
 */
export const useClickOutside = (
    ref: RefObject<HTMLElement | null>,
    callback: () => void,
    enabled = true
): void => {
    useEffect(() => {
        if (!enabled) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref, callback, enabled]);
};
