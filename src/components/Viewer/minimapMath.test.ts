import { describe, it, expect } from 'vitest';
import { calculateViewportBounds, type ViewportInput } from './minimapMath';

describe('calculateViewportBounds', () => {
    it('returns zeros and un-clamped state when logsCount is 0', () => {
        const input: ViewportInput = {
            scrollElementHeight: 500,
            scrollElementScrollHeight: 500,
            scrollElementScrollTop: 0,
            containerHeight: 1000,
            logsCount: 0,
            visibleStartIndex: 0,
            visibleEndIndex: 0,
            lineHeightPx: 4,
        };

        const result = calculateViewportBounds(input);
        expect(result).toEqual({
            minimapScrollTop: 0,
            isClampedTop: false,
            isClampedBottom: false,
            hiddenRows: 0,
            top: 0,
            height: 0,
        });
    });

    it('calculates properly when all logs fit inside the minimap container (no clamping needed)', () => {
        const input: ViewportInput = {
            scrollElementHeight: 100, // 25 logs fit in main viewport (100 / 4)
            scrollElementScrollHeight: 400, // Total 100 logs (400 / 4)
            scrollElementScrollTop: 0, // Scrolled to top
            containerHeight: 1000, // Large container
            logsCount: 100,
            visibleStartIndex: 0,
            visibleEndIndex: 24, // First 25 logs are visible
            lineHeightPx: 4,
        };

        const result = calculateViewportBounds(input);

        expect(result.minimapScrollTop).toBe(0);
        expect(result.isClampedTop).toBe(false);
        expect(result.isClampedBottom).toBe(false);
        expect(result.hiddenRows).toBe(0);
        expect(result.top).toBe(0);
        // Indicator height = 25 logs * 4px = 100px
        expect(result.height).toBe(100);
    });

    it('clamps to the top when the scroll ratio is high but visible start index is small (e.g. dragging minimap top)', () => {
        const input: ViewportInput = {
            scrollElementHeight: 100,
            scrollElementScrollHeight: 4000,
            scrollElementScrollTop: 3000, // High scroll ratio
            containerHeight: 200, // Short container so minimap can scroll
            logsCount: 1000,
            visibleStartIndex: 0, // Force rawTop < 0
            visibleEndIndex: 25,
            lineHeightPx: 4,
        };

        const result = calculateViewportBounds(input);

        expect(result.isClampedTop).toBe(true);
        expect(result.isClampedBottom).toBe(false);
        expect(result.hiddenRows).toBeGreaterThan(0);
        expect(result.top).toBe(0); // Pinned to top
        expect(result.height).toBe(12); // Minimum clamping height is 12
    });

    it('clamps to the bottom when the scroll ratio is low but visible end index is large', () => {
        const input: ViewportInput = {
            scrollElementHeight: 100,
            scrollElementScrollHeight: 4000,
            scrollElementScrollTop: 0, // Low scroll ratio
            containerHeight: 200,
            logsCount: 1000,
            visibleStartIndex: 975,
            visibleEndIndex: 999, // Force rawBottom > containerHeight
            lineHeightPx: 4,
        };

        const result = calculateViewportBounds(input);

        expect(result.isClampedTop).toBe(false);
        expect(result.isClampedBottom).toBe(true);
        expect(result.hiddenRows).toBeGreaterThan(0);
        expect(result.height).toBe(12); // Minimum clamping height is 12
        expect(result.top).toBe(200 - 12); // Pinned to bottom of the 200px container
    });

    it('clamps both top and bottom in extreme edge cases (very small container, many visible logs)', () => {
        const input: ViewportInput = {
            scrollElementHeight: 2000,
            scrollElementScrollHeight: 4000,
            scrollElementScrollTop: 1000,
            containerHeight: 10, // Tiny container
            logsCount: 1000,
            visibleStartIndex: 0,
            visibleEndIndex: 999, // All logs visible
            lineHeightPx: 4,
        };

        const result = calculateViewportBounds(input);

        expect(result.isClampedTop).toBe(true);
        expect(result.isClampedBottom).toBe(true);
        expect(result.top).toBe(0);
        // Minimum height should be enforced and capped by container height
        expect(result.height).toBe(10);
    });
});
