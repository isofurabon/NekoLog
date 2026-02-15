import { useCallback, useState } from 'react';
import { useSetAtom } from 'jotai';
import {
    startFileLoadAtom,
    updateFileProgressAtom,
    finishFileLoadAtom,
} from '@/store';

interface UseFileDropOptions {
    addChunk: (chunk: ArrayBuffer) => void;
    clearLogs: () => void;
    flushLogs: () => void;
    isConnected: boolean;
    disconnect: () => void;
}

const CHUNK_SIZE = 1024 * 1024; // 1MB

export function useFileDrop({
    addChunk,
    clearLogs,
    flushLogs,
    isConnected,
    disconnect,
}: UseFileDropOptions) {
    const [isDragging, setIsDragging] = useState(false);
    const startFileLoad = useSetAtom(startFileLoadAtom);
    const updateProgress = useSetAtom(updateFileProgressAtom);
    const finishFileLoad = useSetAtom(finishFileLoadAtom);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        // Disconnect ADB/Mock if connected
        if (isConnected) {
            disconnect();
        }

        const files = e.dataTransfer.files;
        if (files.length === 0) return;

        const file = files[0];

        // Reset logs and enter file-loading state
        clearLogs();
        startFileLoad(file.name);

        // Read file in chunks via FileReader
        const totalSize = file.size;
        let offset = 0;
        const reader = new FileReader();

        const readNextChunk = () => {
            const slice = file.slice(offset, offset + CHUNK_SIZE);
            reader.readAsArrayBuffer(slice);
        };

        reader.onload = (e) => {
            if (e.target?.result) {
                addChunk(e.target.result as ArrayBuffer);
                offset += CHUNK_SIZE;

                const progress = Math.min(100, Math.round((offset / totalSize) * 100));
                updateProgress(progress);

                if (offset < totalSize) {
                    // Yield to UI thread between chunks
                    setTimeout(readNextChunk, 0);
                } else {
                    finishFileLoad();
                    flushLogs();
                }
            }
        };

        reader.onerror = () => {
            console.error('Error reading file');
            finishFileLoad();
        };

        readNextChunk();
    }, [addChunk, clearLogs, flushLogs, startFileLoad, updateProgress, finishFileLoad, isConnected, disconnect]);

    return { isDragging, handleDragOver, handleDragLeave, handleDrop };
}
