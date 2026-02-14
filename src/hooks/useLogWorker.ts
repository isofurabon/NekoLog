import { useEffect, useRef, useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { logsAtom } from '@/store';
import type { WorkerCommand, WorkerResponse, LogEntry } from '@/types';

export function useLogWorker() {
    const setLogs = useSetAtom(logsAtom);
    const workerRef = useRef<Worker | null>(null);
    const pendingLogsRef = useRef<LogEntry[]>([]);
    const flushTimeoutRef = useRef<number | null>(null);

    const flush = useCallback(() => {
        if (pendingLogsRef.current.length === 0) return;

        const toAdd = [...pendingLogsRef.current];
        pendingLogsRef.current = [];
        flushTimeoutRef.current = null;

        setLogs((prev) => [...prev, ...toAdd]);
    }, [setLogs]);

    useEffect(() => {
        // Initialize worker
        workerRef.current = new Worker(new URL('../workers/parser.ts', import.meta.url), {
            type: 'module',
        });

        workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const { type, payload } = event.data;
            if (type === 'NEW_LOGS') {
                pendingLogsRef.current.push(...payload);

                if (!flushTimeoutRef.current) {
                    // Batch updates to avoid O(N^2) behavior on rapid updates
                    flushTimeoutRef.current = window.setTimeout(flush, 50);
                }
            }
        };

        return () => {
            if (flushTimeoutRef.current) {
                clearTimeout(flushTimeoutRef.current);
                flushTimeoutRef.current = null;
            }
            // Ensure any pending logs are flushed or discarded?
            // Usually on unmount we don't care about pending logs.
            workerRef.current?.terminate();
        };
    }, [flush]);

    const addChunk = useCallback((chunk: ArrayBuffer) => {
        if (workerRef.current) {
            const command: WorkerCommand = { type: 'PARSE_CHUNK', payload: chunk };
            // Transferable object for zero-copy
            workerRef.current.postMessage(command, [chunk]);
        }
    }, []);

    const clearLogs = useCallback(() => {
        // Clear pending logs buffer first
        pendingLogsRef.current = [];
        if (flushTimeoutRef.current) {
            clearTimeout(flushTimeoutRef.current);
            flushTimeoutRef.current = null;
        }

        setLogs([]);
        workerRef.current?.postMessage({ type: 'CLEAR' });
    }, [setLogs]);

    return { addChunk, clearLogs };
}
