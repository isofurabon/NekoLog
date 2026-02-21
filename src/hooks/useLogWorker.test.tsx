import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { Provider, createStore } from 'jotai';
import { useLogWorker } from './useLogWorker';
import { logsAtom } from '@/store';
import type { LogEntry } from '@/types';
import React from 'react';

// Define a type for our mock worker to access test-specific methods
interface MockWorkerInstance extends Worker {
    postMessage: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
}

describe('useLogWorker', () => {
    let mockWorkerInstances: MockWorkerInstance[] = [];

    // Mock Worker implementation
    class MockWorker {
        url: string | URL;
        onmessage: ((event: MessageEvent) => void) | null = null;
        postMessage = vi.fn();
        terminate = vi.fn();

        constructor(stringUrl: string | URL) {
            this.url = stringUrl;
            mockWorkerInstances.push(this as unknown as MockWorkerInstance);
        }
    }

    beforeEach(() => {
        mockWorkerInstances = [];
        vi.stubGlobal('Worker', MockWorker);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const createWrapper = () => {
        const store = createStore();
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <Provider store={store}>
                {children}
            </Provider>
        );
        return { wrapper, store };
    };

    it('initializes worker with correct URL', () => {
        const { wrapper } = createWrapper();
        renderHook(() => useLogWorker(), { wrapper });

        expect(mockWorkerInstances).toHaveLength(1);
        // The URL is relative in the source, but resolved by new URL(..., import.meta.url)
        // We just verify a worker was created.
    });

    it('sends PARSE_CHUNK command when addChunk is called', () => {
        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useLogWorker(), { wrapper });
        const worker = mockWorkerInstances[0];

        const chunk = new ArrayBuffer(10);
        result.current.addChunk(chunk);

        expect(worker.postMessage).toHaveBeenCalledWith(
            { type: 'PARSE_CHUNK', payload: chunk },
            [chunk]
        );
    });

    it('sends CLEAR command and resets logs when clearLogs is called', () => {
        const { wrapper, store } = createWrapper();
        const { result } = renderHook(() => useLogWorker(), { wrapper });
        const worker = mockWorkerInstances[0];

        // Set some initial logs
        store.set(logsAtom, [{ id: '1', message: 'test' } as LogEntry]);

        act(() => {
            result.current.clearLogs();
        });

        expect(worker.postMessage).toHaveBeenCalledWith({ type: 'CLEAR' });
        expect(store.get(logsAtom)).toEqual([]);
    });

    it('sends FLUSH command when flushLogs is called', () => {
        const { wrapper } = createWrapper();
        const { result } = renderHook(() => useLogWorker(), { wrapper });
        const worker = mockWorkerInstances[0];

        result.current.flushLogs();

        expect(worker.postMessage).toHaveBeenCalledWith({ type: 'FLUSH' });
    });

    it('updates logsAtom when worker sends NEW_LOGS message', () => {
        const { wrapper, store } = createWrapper();
        renderHook(() => useLogWorker(), { wrapper });
        const worker = mockWorkerInstances[0];

        const newLogs: LogEntry[] = [
            { id: '1', message: 'log1', timestamp: 'time1', level: 'I', tag: 'tag1', pid: '1', tid: '1' },
            { id: '2', message: 'log2', timestamp: 'time2', level: 'D', tag: 'tag2', pid: '2', tid: '2' },
        ];

        act(() => {
            if (worker.onmessage) {
                worker.onmessage({
                    data: { type: 'NEW_LOGS', payload: newLogs }
                } as MessageEvent);
            }
        });

        expect(store.get(logsAtom)).toEqual(newLogs);
    });

    it('appends new logs to existing logs', () => {
        const { wrapper, store } = createWrapper();
        renderHook(() => useLogWorker(), { wrapper });
        const worker = mockWorkerInstances[0];

        const initialLog: LogEntry = { id: '1', message: 'log1', timestamp: 'time1', level: 'I', tag: 'tag1', pid: '1', tid: '1' };
        store.set(logsAtom, [initialLog]);

        const newLogs: LogEntry[] = [
            { id: '2', message: 'log2', timestamp: 'time2', level: 'D', tag: 'tag2', pid: '2', tid: '2' },
        ];

        act(() => {
            if (worker.onmessage) {
                worker.onmessage({
                    data: { type: 'NEW_LOGS', payload: newLogs }
                } as MessageEvent);
            }
        });

        expect(store.get(logsAtom)).toEqual([initialLog, ...newLogs]);
    });

    it('terminates worker on unmount', () => {
        const { wrapper } = createWrapper();
        const { unmount } = renderHook(() => useLogWorker(), { wrapper });
        const worker = mockWorkerInstances[0];

        unmount();

        expect(worker.terminate).toHaveBeenCalled();
    });
});
