import { useEffect, useRef, useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { logsAtom } from '@/store';
import type { WorkerCommand, WorkerResponse, LogEntry } from '@/types';

export function useLogWorker() {
    const setLogs = useSetAtom(logsAtom);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize worker
        workerRef.current = new Worker(new URL('../workers/parser.ts', import.meta.url), {
            type: 'module',
        });

        workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { type, payload } = event.data;
            if (type === 'NEW_LOGS') {
                setLogs((prev: LogEntry[]) => [...prev, ...payload]);
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, [setLogs]);

    const addChunk = useCallback((chunk: ArrayBuffer) => {
        if (workerRef.current) {
            const command: WorkerCommand = { type: 'PARSE_CHUNK', payload: chunk };

            // Transferable object for zero-copy
            workerRef.current.postMessage(command, [chunk]);
        }
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
        workerRef.current?.postMessage({ type: 'CLEAR' });
    }, [setLogs]);

    const flushLogs = useCallback(() => {
        workerRef.current?.postMessage({ type: 'FLUSH' });
    }, []);

    return { addChunk, clearLogs, flushLogs };

}
