import { renderHook, act } from '@testing-library/react';
import { useFileDrop } from './useFileDrop';
import React from 'react';
import { Provider, createStore } from 'jotai';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startFileLoadAtom, cancelFileLoadAtom, isLoadingFileAtom } from '@/store';

// Mock functions
const mockAddChunk = vi.fn();
const mockClearLogs = vi.fn();
const mockFlushLogs = vi.fn();
const mockDisconnect = vi.fn();

// Mock FileReader
const mockAbort = vi.fn();
const mockReadAsArrayBuffer = vi.fn();

class MockFileReader {
    abort = mockAbort;
    readAsArrayBuffer = mockReadAsArrayBuffer;
    onload: any = null;
    onerror: any = null;
    result: any = null;

    constructor() {
        // Track the last created reader for manual triggering
        // @ts-ignore
        global.lastReaderInstance = this;
    }
}

describe('useFileDrop', () => {
    let store: ReturnType<typeof createStore>;

    beforeEach(() => {
        store = createStore();
        mockAbort.mockClear();
        mockReadAsArrayBuffer.mockClear();
        mockAddChunk.mockClear();
        // @ts-ignore
        global.lastReaderInstance = null;

        vi.stubGlobal('FileReader', MockFileReader);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('aborts reading when loading is cancelled', () => {
        const mockOptions = {
            addChunk: mockAddChunk,
            clearLogs: mockClearLogs,
            flushLogs: mockFlushLogs,
            isConnected: false,
            disconnect: mockDisconnect,
        };

        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <Provider store={store}>{children}</Provider>
        );

        const { result } = renderHook(() => useFileDrop(mockOptions), { wrapper });

        // Simulate drop
        const file = new File(['test content'], 'test.log', { type: 'text/plain' });
        const event = {
            preventDefault: vi.fn(),
            dataTransfer: { files: [file] }
        } as unknown as React.DragEvent;

        act(() => {
            result.current.handleDrop(event);
        });

        // Should have created reader and started reading
        expect(mockReadAsArrayBuffer).toHaveBeenCalled();
        expect(store.get(isLoadingFileAtom)).toBe(true);

        // Cancel
        act(() => {
            store.set(cancelFileLoadAtom);
        });

        // Verify abort called
        expect(mockAbort).toHaveBeenCalled();
        expect(store.get(isLoadingFileAtom)).toBe(false);

        // Verify zombie protection: if onload fires after abort, it shouldn't add chunks
        // @ts-ignore
        const reader = global.lastReaderInstance;
        if (reader && reader.onload) {
            act(() => {
                reader.onload({ target: { result: new ArrayBuffer(10) } });
            });
        }
        expect(mockAddChunk).not.toHaveBeenCalled();
    });
});
