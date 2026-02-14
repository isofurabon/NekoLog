import { renderHook, act, waitFor } from '@testing-library/react';
import { useLogWorker } from '@/hooks/useLogWorker';
import { logsAtom } from '@/store';
import { Provider, createStore } from 'jotai';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock Worker
class MockWorker {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage(_message: unknown) { }
    terminate() {}
}

// deno-lint-ignore no-explicit-any
const OriginalWorker = (globalThis as any).Worker;

describe('useLogWorker Performance Benchmark', () => {
    let workerInstance: MockWorker;

    beforeEach(() => {
        // deno-lint-ignore no-explicit-any
        (globalThis as any).Worker = class extends MockWorker {
            constructor() {
                super();
                workerInstance = this;
            }
        };
    });

    afterEach(() => {
        // deno-lint-ignore no-explicit-any
        (globalThis as any).Worker = OriginalWorker;
    });

    it('measures time to process updates with large initial state', async () => {
        const store = createStore();
        // Pre-fill with 50,000 logs
        const initialLogs = Array(50000).fill(0).map((_, i) => ({
            message: `log ${i}`, timestamp: '2023-01-01', level: 'info'
        }));
        store.set(logsAtom, initialLogs);

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <Provider store={store}>{children}</Provider>
        );

        const { unmount } = renderHook(() => useLogWorker(), { wrapper });

        expect(workerInstance).toBeDefined();

        const logsToAdd = Array(10).fill({ message: 'new log', timestamp: '2023-01-01', level: 'info' });
        const updateCount = 500;

        const startTime = performance.now();

        await act(() => {
            for (let i = 0; i < updateCount; i++) {
                if (workerInstance.onmessage) {
                    workerInstance.onmessage({
                        data: { type: 'NEW_LOGS', payload: logsToAdd }
                    } as MessageEvent);
                }
            }
        });

        // Wait for flush (approx 50ms + execution)
        // We use waitFor to ensure state is updated
        await waitFor(() => {
             const logs = store.get(logsAtom);
             expect(logs.length).toBe(50000 + updateCount * 10);
        }, { timeout: 1000 });

        const endTime = performance.now();
        const duration = endTime - startTime;

        console.log(`Time taken for ${updateCount} updates with 50k initial logs (including flush): ${duration.toFixed(2)}ms`);

        unmount();
    });
});
