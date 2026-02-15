import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { LogActions } from './LogActions.tsx';
import { autoScrollAtom, logsAtom } from '@/store';
import { downloadLogs } from '@/utils/download.ts';
import type { LogEntry } from '@/types';
import React from 'react';

// Mock downloadLogs
vi.mock('@/utils/download.ts', () => ({
    downloadLogs: vi.fn(),
}));

const renderWithProvider = (ui: React.ReactNode, store = createStore()) => {
    return {
        ...render(<Provider store={store}>{ui}</Provider>),
        store,
    };
};

describe('LogActions Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders when isExpanded is false and isHovered is true', () => {
        const onClear = vi.fn();
        renderWithProvider(<LogActions isExpanded={false} isHovered={true} onClear={onClear} />);

        expect(screen.getByTitle('Toggle Auto-scroll')).toBeInTheDocument();
        expect(screen.getByTitle('Download Logs')).toBeInTheDocument();
        expect(screen.getByTitle('Clear Logs')).toBeInTheDocument();
    });

    it('does not render when isExpanded is true', () => {
        const onClear = vi.fn();
        renderWithProvider(<LogActions isExpanded={true} isHovered={true} onClear={onClear} />);

        expect(screen.queryByTitle('Toggle Auto-scroll')).not.toBeInTheDocument();
    });

    it('does not render when isHovered is false', () => {
        const onClear = vi.fn();
        renderWithProvider(<LogActions isExpanded={false} isHovered={false} onClear={onClear} />);

        expect(screen.queryByTitle('Toggle Auto-scroll')).not.toBeInTheDocument();
    });

    it('toggles autoScrollAtom when auto-scroll button is clicked', () => {
        const store = createStore();
        store.set(autoScrollAtom, false);
        const onClear = vi.fn();

        renderWithProvider(<LogActions isExpanded={false} isHovered={true} onClear={onClear} />, store);

        const toggleButton = screen.getByTitle('Toggle Auto-scroll');

        fireEvent.click(toggleButton);
        expect(store.get(autoScrollAtom)).toBe(true);

        fireEvent.click(toggleButton);
        expect(store.get(autoScrollAtom)).toBe(false);
    });

    it('calls downloadLogs with current logs when download button is clicked', () => {
        const store = createStore();
        const mockLogs: LogEntry[] = [
            { id: '1', timestamp: '01-01 10:00:00.000', level: 'I', tag: 'Test', message: 'Log 1', pid: '1', tid: '1' },
            { id: '2', timestamp: '01-01 10:00:01.000', level: 'E', tag: 'Test', message: 'Log 2', pid: '2', tid: '2' },
        ];
        store.set(logsAtom, mockLogs);

        const onClear = vi.fn();
        renderWithProvider(<LogActions isExpanded={false} isHovered={true} onClear={onClear} />, store);

        const downloadButton = screen.getByTitle('Download Logs');
        fireEvent.click(downloadButton);

        expect(downloadLogs).toHaveBeenCalledWith(mockLogs, { format: 'txt' });
    });

    it('calls onClear when clear button is clicked', () => {
        const onClear = vi.fn();
        renderWithProvider(<LogActions isExpanded={false} isHovered={true} onClear={onClear} />);

        const clearButton = screen.getByTitle('Clear Logs');
        fireEvent.click(clearButton);

        expect(onClear).toHaveBeenCalled();
    });
});
