import { describe, it, expect } from 'vitest';
import { processChunk, MAX_BUFFER_SIZE } from './parser';

describe('Log Parser Security', () => {
    it('processes normal logs correctly', () => {
        const chunk = '01-15 10:30:45.123  1234  5678 I Tag: Message\n';
        const result = processChunk(chunk, '');

        expect(result.logs).toHaveLength(1);
        expect(result.logs[0].message).toBe('Message');
        expect(result.nextBuffer).toBe('');
    });

    it('handles buffer accumulation', () => {
        const part1 = '01-15 10:30:45.123  1234  5678 I Tag: Mess';
        const result1 = processChunk(part1, '');
        expect(result1.logs).toHaveLength(0);
        expect(result1.nextBuffer).toBe(part1);

        const part2 = 'age\n';
        const result2 = processChunk(part2, result1.nextBuffer);
        expect(result2.logs).toHaveLength(1);
        expect(result2.logs[0].message).toBe('Message');
        expect(result2.nextBuffer).toBe('');
    });

    it('prevents buffer overflow with single huge line', () => {
        // Create a string slightly larger than MAX_BUFFER_SIZE
        const hugeString = 'A'.repeat(MAX_BUFFER_SIZE + 100);

        const result = processChunk(hugeString, '');

        // Should have cleared buffer and produced a warning
        expect(result.nextBuffer).toBe('');
        expect(result.logs).toHaveLength(1);
        expect(result.logs[0].level).toBe('W');
        expect(result.logs[0].message).toContain('Buffer overflow');
    });

    it('prevents buffer overflow when appending to existing buffer', () => {
        const initialBuffer = 'A'.repeat(MAX_BUFFER_SIZE - 100);
        const chunk = 'A'.repeat(200); // Total > MAX_BUFFER_SIZE

        const result = processChunk(chunk, initialBuffer);

        expect(result.nextBuffer).toBe('');
        expect(result.logs).toHaveLength(1);
        expect(result.logs[0].level).toBe('W');
        expect(result.logs[0].message).toContain('Buffer overflow');
    });

    it('handles huge tail after valid lines', () => {
        const validLine = '01-15 10:30:45.123  1234  5678 I Tag: Message\n';
        const hugeTail = 'A'.repeat(MAX_BUFFER_SIZE + 100);
        const chunk = validLine + hugeTail;

        const result = processChunk(chunk, '');

        // Should process valid line, then detect overflow
        // Logic says: if tail > MAX, process valid part, discard tail, warn.

        // We expect:
        // 1. The valid log
        // 2. The warning log
        expect(result.logs.length).toBeGreaterThanOrEqual(2);

        const validLog = result.logs.find(l => l.message === 'Message');
        expect(validLog).toBeDefined();

        const warningLog = result.logs.find(l => l.level === 'W');
        expect(warningLog).toBeDefined();
        expect(warningLog?.message).toContain('Buffer overflow');

        expect(result.nextBuffer).toBe('');
    });
});
