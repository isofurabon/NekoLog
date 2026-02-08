import { describe, it, expect } from 'vitest';
import { getLevelColor, getBgHoverColor } from './color.ts';
import type { LogLevel } from '@/types';

describe('color utilities', () => {
    describe('getLevelColor', () => {
        it('returns correct color for Error level', () => {
            expect(getLevelColor('E')).toBe('text-red-500 border-red-500');
        });

        it('returns correct color for Warning level', () => {
            expect(getLevelColor('W')).toBe('text-yellow-500 border-yellow-500');
        });

        it('returns correct color for Info level', () => {
            expect(getLevelColor('I')).toBe('text-gray-300 border-gray-300');
        });

        it('returns correct color for Debug level', () => {
            expect(getLevelColor('D')).toBe('text-gray-400 border-gray-400');
        });

        it('returns correct color for Verbose level', () => {
            expect(getLevelColor('V')).toBe('text-gray-500 border-gray-500');
        });

        it('returns correct color for Fatal level', () => {
            expect(getLevelColor('F')).toBe('text-purple-500 border-purple-500');
        });

        it('returns fallback color for unknown level', () => {
            expect(getLevelColor('X' as LogLevel)).toBe('text-gray-400 border-gray-400');
        });
    });

    describe('getBgHoverColor', () => {
        it('returns correct hover color for Error level', () => {
            expect(getBgHoverColor('E')).toBe('hover:bg-red-500/10');
        });

        it('returns correct hover color for Warning level', () => {
            expect(getBgHoverColor('W')).toBe('hover:bg-yellow-500/10');
        });

        it('returns correct hover color for Info level', () => {
            expect(getBgHoverColor('I')).toBe('hover:bg-gray-500/10');
        });

        it('returns correct hover color for Debug level', () => {
            expect(getBgHoverColor('D')).toBe('hover:bg-gray-500/10');
        });

        it('returns correct hover color for Verbose level', () => {
            expect(getBgHoverColor('V')).toBe('hover:bg-gray-500/10');
        });

        it('returns correct hover color for Fatal level', () => {
            expect(getBgHoverColor('F')).toBe('hover:bg-purple-500/10');
        });

        it('returns fallback hover color for unknown level', () => {
            expect(getBgHoverColor('X' as LogLevel)).toBe('hover:bg-white/5');
        });
    });
});
