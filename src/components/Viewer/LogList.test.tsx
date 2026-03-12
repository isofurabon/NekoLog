import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import type { VirtualItem } from '@tanstack/react-virtual';
import { LogList } from './LogList.tsx';
import { logsAtom, filterTextAtom, autoScrollAtom, includedFieldsAtom } from '@/store';
import type { LogEntry } from '@/types';

// Mock child components
vi.mock('./LogRow.tsx', () => ({
    LogRow: ({ log }: { log: LogEntry }) => <div data-testid="log-row">{log.message}</div>,
}));

vi.mock('./Minimap.tsx', () => ({
    Minimap: () => <div data-testid="minimap" />,
}));

// Mock react-virtual
const {
    mockScrollToIndex,
    mockGetTotalSize,
    mockGetVirtualItems,
    mockMeasureElement,
} = vi.hoisted(() => ({
    mockScrollToIndex: vi.fn(),
    mockGetTotalSize: vi.fn(() => 100),
    mockGetVirtualItems: vi.fn(() => []),
    mockMeasureElement: vi.fn(),
}));

vi.mock('@tanstack/react-virtual', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@tanstack/react-virtual')>();
    return {
        ...actual,
        useVirtualizer: () => ({
            getVirtualItems: mockGetVirtualItems,
            getTotalSize: mockGetTotalSize,
            scrollToIndex: mockScrollToIndex,
            measureElement: mockMeasureElement,
        }),
    };
});

describe('LogList Component', () => {
    let store: ReturnType<typeof createStore>;

    const createMockLog = (overrides: Partial<LogEntry> = {}): LogEntry => ({
        id: 'test-id-' + Math.random(),
        timestamp: '01-15 10:30:45.123',
        pid: '1234',
        tid: '5678',
        level: 'I',
        tag: 'TestTag',
        message: 'Test message content',
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
        store = createStore();
        // Setup default atom states
        store.set(filterTextAtom, '');
        store.set(includedFieldsAtom, ['message']);
        store.set(autoScrollAtom, true);
    });

    const renderWithProvider = () => {
        return render(
            <Provider store={store}>
                <LogList />
            </Provider>
        );
    };

    it('renders empty list correctly', () => {
        store.set(logsAtom, []);
        mockGetVirtualItems.mockReturnValue([]);

        renderWithProvider();

        expect(screen.getByTestId('minimap')).toBeInTheDocument();
        expect(screen.queryByTestId('log-row')).not.toBeInTheDocument();
    });

    it('renders logs correctly using virtualizer', () => {
        const logs = [createMockLog({ message: 'Log 1' }), createMockLog({ message: 'Log 2' })];
        store.set(logsAtom, logs);

        const mockVirtualItems: Partial<VirtualItem>[] = [
            { key: '0', index: 0, start: 0, end: 24, size: 24 },
            { key: '1', index: 1, start: 24, end: 48, size: 24 },
        ];
        mockGetVirtualItems.mockReturnValue(mockVirtualItems as VirtualItem[]);

        renderWithProvider();

        const rows = screen.getAllByTestId('log-row');
        expect(rows).toHaveLength(2);
        expect(rows[0]).toHaveTextContent('Log 1');
        expect(rows[1]).toHaveTextContent('Log 2');
    });

    it('auto-scrolls to bottom when new logs are added and autoScroll is true', () => {
        const logs = [createMockLog(), createMockLog()];
        store.set(logsAtom, logs);
        store.set(autoScrollAtom, true);

        renderWithProvider();

        expect(mockScrollToIndex).toHaveBeenCalledWith(1, { align: 'end' });
    });

    it('does not auto-scroll when autoScroll is false', () => {
        const logs = [createMockLog(), createMockLog()];
        store.set(logsAtom, logs);
        store.set(autoScrollAtom, false);

        renderWithProvider();

        expect(mockScrollToIndex).not.toHaveBeenCalled();
    });

    it('disables auto-scroll on user interaction and scrolling up', () => {
        const logs = Array.from({ length: 100 }, () => createMockLog());
        store.set(logsAtom, logs);
        store.set(autoScrollAtom, true);

        const { container } = renderWithProvider();

        // Find the scrollable container
        const scrollContainer = screen.getByTestId('log-list-scroll-container');
        expect(scrollContainer).toBeInTheDocument();

        // Simulate user interaction (e.g., wheel event)
        fireEvent.wheel(container.firstChild as Element);

        // Simulate scroll event where user scrolls up (not at bottom)
        Object.defineProperty(scrollContainer, 'scrollTop', { value: 0, configurable: true });
        Object.defineProperty(scrollContainer, 'scrollHeight', { value: 2000, configurable: true });
        Object.defineProperty(scrollContainer, 'clientHeight', { value: 500, configurable: true });

        act(() => {
            fireEvent.scroll(scrollContainer);
        });

        // Verify that autoScrollAtom was set to false
        expect(store.get(autoScrollAtom)).toBe(false);
    });

    it('maintains auto-scroll when scrolling near bottom', () => {
        const logs = Array.from({ length: 100 }, () => createMockLog());
        store.set(logsAtom, logs);
        store.set(autoScrollAtom, true);

        const { container } = renderWithProvider();

        const scrollContainer = screen.getByTestId('log-list-scroll-container');
        expect(scrollContainer).toBeInTheDocument();

        fireEvent.wheel(container.firstChild as Element);

        // Distance to bottom < SCROLL_THRESHOLD (50)
        Object.defineProperty(scrollContainer, 'scrollTop', { value: 1460, configurable: true });
        Object.defineProperty(scrollContainer, 'scrollHeight', { value: 2000, configurable: true });
        Object.defineProperty(scrollContainer, 'clientHeight', { value: 500, configurable: true }); // Distance is 40

        act(() => {
            fireEvent.scroll(scrollContainer);
        });

        // autoScroll should still be true
        expect(store.get(autoScrollAtom)).toBe(true);
    });
});
