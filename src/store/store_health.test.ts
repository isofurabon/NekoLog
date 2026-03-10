import { describe, it, expect } from 'vitest';
import { createStore } from 'jotai';
import { logsAtom, filterTextAtom, includedFieldsAtom, filteredLogsAtom } from './index.ts';
import type { LogEntry } from '@/types';

const createMockLog = (overrides: Partial<LogEntry> = {}): LogEntry => ({
    id: 'test-id',
    timestamp: '01-15 10:30:45.123',
    pid: '1234',
    tid: '5678',
    level: 'I',
    tag: 'TestTag',
    message: 'Test message',
    ...overrides,
});

describe('Store Atoms - Robustness', () => {
    it('handles non-string values gracefully when filtering', () => {
        const store = createStore();

        // Simulate dirty data coming from API or incorrect parsing
        const logs = [
            createMockLog({ id: '1', message: 'Valid string' }),
            // @ts-ignore: Intentionally testing invalid type
            createMockLog({ id: '2', message: 12345 }),
            // @ts-ignore: Intentionally testing invalid type
            createMockLog({ id: '3', message: null }),
        ];

        store.set(logsAtom, logs);
        store.set(filterTextAtom, '123'); // Should match '12345'
        store.set(includedFieldsAtom, new Set(['message']));

        const filtered = store.get(filteredLogsAtom);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('2');
    });

    it('handles null values gracefully', () => {
         const store = createStore();

        // Simulate dirty data coming from API or incorrect parsing
        const logs = [
            createMockLog({ id: '1', message: 'Valid string' }),
            // @ts-ignore: Intentionally testing invalid type
            createMockLog({ id: '3', message: null }),
        ];

        store.set(logsAtom, logs);
        store.set(filterTextAtom, 'null'); // Should match 'null' if String(null) is used
        store.set(includedFieldsAtom, new Set(['message']));

        const filtered = store.get(filteredLogsAtom);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('3');
    });
});
