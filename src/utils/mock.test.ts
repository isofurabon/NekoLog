import { describe, it, expect } from 'vitest';
import { generateMockLog } from './mock.ts';

describe('generateMockLog', () => {
    it('returns a log string in the correct format', () => {
        const log = generateMockLog();

        // Regex components
        const timestamp = '\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3}';
        const pid = '\\d+';
        const tid = '\\d+';
        const level = '[DIWEV]';
        const tag = '(ActivityManager|WindowManager|NekoService|SystemUI)';
        const message = 'This is a mock log message #\\d+ x*';

        const regex = new RegExp(`^${timestamp} ${pid} ${tid} ${level} ${tag}: ${message}\\n$`);

        expect(log).toMatch(regex);
    });

    it('returns different logs on subsequent calls', () => {
        const log1 = generateMockLog();
        const log2 = generateMockLog();
        expect(log1).not.toBe(log2);
    });
});
