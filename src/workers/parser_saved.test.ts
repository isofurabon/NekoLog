import { expect, test, describe } from 'vitest';
import { parseLogLine } from './parser';

describe('Parser - Saved File Format', () => {
    test('should parse log line with PID/TID format', () => {
        const line = '02-15 16:03:56.424  1138/ 1163 I android.hardware.thermal@2.0-service.qti: Sensor Name:usbport temp:26.467';
        const parsed = parseLogLine(line);
        expect(parsed).not.toBeNull();
        expect(parsed?.timestamp).toBe('02-15 16:03:56.424');
        expect(parsed?.pid).toBe('1138');
        expect(parsed?.tid).toBe('1163');
        expect(parsed?.level).toBe('I');
        expect(parsed?.tag).toBe('android.hardware.thermal@2.0-service.qti');
        expect(parsed?.message).toBe('Sensor Name:usbport temp:26.467');
    });

    test('should parse log line with ? placeholder', () => {
        const line = '02-15 07:03:56.669     ?/    ? I Raw: --------- beginning of main';
        const parsed = parseLogLine(line);
        expect(parsed).not.toBeNull();
        expect(parsed?.timestamp).toBe('02-15 07:03:56.669');
        expect(parsed?.pid).toBe('?');
        expect(parsed?.tid).toBe('?');
        expect(parsed?.level).toBe('I');
        expect(parsed?.tag).toBe('Raw');
        expect(parsed?.message).toBe('--------- beginning of main');
    });
});
