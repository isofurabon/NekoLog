import { describe, it, expect } from 'vitest';
import type { LogLevel } from '@/types';

// Parse logic extracted for testing (since worker uses self.onmessage)
const LOG_REGEX = /^(\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3})\s+(\d+)\s+(\d+)\s+([VDIWEF])\s+(.*?):\s+(.*)$/;

interface ParsedLog {
    timestamp: string;
    pid: string;
    tid: string;
    level: LogLevel;
    tag: string;
    message: string;
}

function parseLine(line: string): ParsedLog | null {
    const match = line.match(LOG_REGEX);
    if (!match) return null;

    const [, timestamp, pid, tid, level, tag, message] = match;
    return {
        timestamp,
        pid,
        tid,
        level: level as LogLevel,
        tag: tag.trim(),
        message: message.trim(),
    };
}

describe('Log Parser', () => {
    describe('LOG_REGEX', () => {
        it('matches standard threadtime format', () => {
            const line = '01-15 10:30:45.123  1234  5678 I ActivityManager: Starting activity';
            expect(LOG_REGEX.test(line)).toBe(true);
        });

        it('matches logs with various levels', () => {
            const levels = ['V', 'D', 'I', 'W', 'E', 'F'];
            levels.forEach(level => {
                const line = `01-15 10:30:45.123  1234  5678 ${level} Tag: Message`;
                expect(LOG_REGEX.test(line)).toBe(true);
            });
        });

        it('does not match malformed lines', () => {
            expect(LOG_REGEX.test('random text')).toBe(false);
            expect(LOG_REGEX.test('01-15 10:30:45 1234 5678 I Tag: Message')).toBe(false); // Missing milliseconds
            expect(LOG_REGEX.test('')).toBe(false);
        });
    });

    describe('parseLine', () => {
        it('extracts all fields correctly', () => {
            const line = '01-15 10:30:45.123  1234  5678 I ActivityManager: Starting activity';
            const result = parseLine(line);

            expect(result).toEqual({
                timestamp: '01-15 10:30:45.123',
                pid: '1234',
                tid: '5678',
                level: 'I',
                tag: 'ActivityManager',
                message: 'Starting activity',
            });
        });

        it('handles tags with special characters', () => {
            const line = '01-15 10:30:45.123  1234  5678 D My.Package.Tag: Some message';
            const result = parseLine(line);

            expect(result?.tag).toBe('My.Package.Tag');
        });

        it('preserves message content with colons', () => {
            const line = '01-15 10:30:45.123  1234  5678 W Logger: Error: something went wrong';
            const result = parseLine(line);

            expect(result?.message).toBe('Error: something went wrong');
        });

        it('handles high PIDs and TIDs', () => {
            const line = '01-15 10:30:45.123 99999 88888 E Crash: Fatal error';
            const result = parseLine(line);

            expect(result?.pid).toBe('99999');
            expect(result?.tid).toBe('88888');
        });

        it('returns null for malformed lines', () => {
            expect(parseLine('not a log line')).toBeNull();
            expect(parseLine('')).toBeNull();
        });

        it('handles messages with leading/trailing whitespace', () => {
            const line = '01-15 10:30:45.123  1234  5678 I Tag:   spaced message  ';
            const result = parseLine(line);

            expect(result?.message).toBe('spaced message');
        });
    });
});
