import { describe, it, expect } from 'vitest';
import { parseLogLine, LOG_REGEX } from './parser';

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

    describe('parseLogLine', () => {
        it('extracts all fields correctly', () => {
            const line = '01-15 10:30:45.123  1234  5678 I ActivityManager: Starting activity';
            const result = parseLogLine(line);

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
            const result = parseLogLine(line);

            expect(result?.tag).toBe('My.Package.Tag');
        });

        it('preserves message content with colons', () => {
            const line = '01-15 10:30:45.123  1234  5678 W Logger: Error: something went wrong';
            const result = parseLogLine(line);

            expect(result?.message).toBe('Error: something went wrong');
        });

        it('handles high PIDs and TIDs', () => {
            const line = '01-15 10:30:45.123 99999 88888 E Crash: Fatal error';
            const result = parseLogLine(line);

            expect(result?.pid).toBe('99999');
            expect(result?.tid).toBe('88888');
        });

        it('returns null for empty lines', () => {
            expect(parseLogLine('')).toBeNull();
            expect(parseLogLine('   ')).toBeNull();
        });

        it('returns fallback entry for malformed lines', () => {
            const line = 'Some random stack trace or malformed log';
            const result = parseLogLine(line);

            expect(result).not.toBeNull();
            expect(result?.level).toBe('I');
            expect(result?.tag).toBe('Raw');

            expect(result?.message).toBe(line);
            expect(result?.pid).toBe('?');
            expect(result?.tid).toBe('?');

            // Verify timestamp matches format "MM-DD HH:mm:ss.mmm"
            expect(result?.timestamp).toMatch(/^\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\.\d{3}$/);
        });

        it('handles messages with leading/trailing whitespace in fallback', () => {
            const line = '   some error   ';
            const result = parseLogLine(line);

            // parseLogLine returns the original line as message for fallback
            expect(result?.message).toBe(line);
        });

        it('handles long lines by omitting message', () => {
            const longLine = 'a'.repeat(10001);
            const result = parseLogLine(longLine);

            expect(result).not.toBeNull();
            expect(result?.level).toBe('W');
            expect(result?.tag).toBe('System');
            expect(result?.message).toBe('<Message too long, omitted>');
        });

    });
});
