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

describe('Store Atoms', () => {
    describe('filteredLogsAtom', () => {
        it('returns all logs when filter is empty', () => {
            const store = createStore();
            const logs = [
                createMockLog({ id: '1', message: 'First message' }),
                createMockLog({ id: '2', message: 'Second message' }),
            ];

            store.set(logsAtom, logs);
            store.set(filterTextAtom, '');

            const filtered = store.get(filteredLogsAtom);
            expect(filtered).toHaveLength(2);
        });

        it('filters by message content', () => {
            const store = createStore();
            const logs = [
                createMockLog({ id: '1', message: 'Hello world' }),
                createMockLog({ id: '2', message: 'Goodbye world' }),
                createMockLog({ id: '3', message: 'Hello universe' }),
            ];

            store.set(logsAtom, logs);
            store.set(filterTextAtom, 'hello');
            store.set(includedFieldsAtom, new Set(['message']));

            const filtered = store.get(filteredLogsAtom);
            expect(filtered).toHaveLength(2);
            expect(filtered.map((l: LogEntry) => l.id)).toEqual(['1', '3']);
        });

        it('filters by tag when included', () => {
            const store = createStore();
            const logs = [
                createMockLog({ id: '1', tag: 'ActivityManager' }),
                createMockLog({ id: '2', tag: 'WindowManager' }),
                createMockLog({ id: '3', tag: 'ActivityManager' }),
            ];

            store.set(logsAtom, logs);
            store.set(filterTextAtom, 'activity');
            store.set(includedFieldsAtom, new Set(['tag']));

            const filtered = store.get(filteredLogsAtom);
            expect(filtered).toHaveLength(2);
        });

        it('uses exact match for level field', () => {
            const store = createStore();
            const logs = [
                createMockLog({ id: '1', level: 'E' }),
                createMockLog({ id: '2', level: 'I' }),
                createMockLog({ id: '3', level: 'E' }),
            ];

            store.set(logsAtom, logs);
            store.set(filterTextAtom, 'e');
            store.set(includedFieldsAtom, new Set(['level']));

            const filtered = store.get(filteredLogsAtom);
            expect(filtered).toHaveLength(2);
            expect(filtered.every((l: LogEntry) => l.level === 'E')).toBe(true);
        });

        it('searches multiple fields when specified', () => {
            const store = createStore();
            const logs = [
                createMockLog({ id: '1', tag: 'SearchTag', message: 'Normal message' }),
                createMockLog({ id: '2', tag: 'OtherTag', message: 'Contains search term' }),
                createMockLog({ id: '3', tag: 'NoMatch', message: 'No match here' }),
            ];

            store.set(logsAtom, logs);
            store.set(filterTextAtom, 'search');
            store.set(includedFieldsAtom, new Set(['tag', 'message']));

            const filtered = store.get(filteredLogsAtom);
            expect(filtered).toHaveLength(2);
            expect(filtered.map((l: LogEntry) => l.id)).toEqual(['1', '2']);
        });

        it('is case insensitive', () => {
            const store = createStore();
            const logs = [
                createMockLog({ id: '1', message: 'UPPERCASE' }),
                createMockLog({ id: '2', message: 'lowercase' }),
                createMockLog({ id: '3', message: 'MixedCase' }),
            ];

            store.set(logsAtom, logs);
            store.set(filterTextAtom, 'CASE');
            store.set(includedFieldsAtom, new Set(['message']));

            const filtered = store.get(filteredLogsAtom);
            expect(filtered).toHaveLength(3);
        });
    });
});
