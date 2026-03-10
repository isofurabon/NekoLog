import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import App from './App.tsx';
import React from 'react';

// Mock child components to isolate App component testing
vi.mock('@/components/Viewer/LogList.tsx', () => ({
    LogList: () => <div data-testid="log-list">LogList Component</div>,
}));

vi.mock('@/components/ControlBar/ControlBar.tsx', () => ({
    ControlBar: ({ onConnect, onClear, isConnected, deviceUniqueId }: {
        onConnect: () => void;
        onClear: () => void;
        isConnected: boolean;
        deviceUniqueId?: string;
    }) => (
        <div data-testid="control-bar">
            ControlBar Component
            <button type="button" onClick={onConnect}>Connect</button>
            <button type="button" onClick={onClear}>Clear</button>
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            <span>{deviceUniqueId}</span>
        </div>
    ),
}));

// Mock hooks
vi.mock('@/hooks/useLogWorker.ts', () => ({
    useLogWorker: vi.fn(),
}));

vi.mock('@/hooks/useAdb.ts', () => ({
    useAdb: vi.fn(),
}));

vi.mock('@/hooks/useFileDrop.ts', () => ({
    useFileDrop: vi.fn(),
}));

// Import the mocked hooks so we can change their return values
import { useLogWorker } from '@/hooks/useLogWorker.ts';
import { useAdb } from '@/hooks/useAdb.ts';
import { useFileDrop } from '@/hooks/useFileDrop.ts';

const renderWithProvider = (ui: React.ReactNode, store = createStore()) => {
    return {
        ...render(<Provider store={store}>{ui}</Provider>),
        store,
    };
};

describe('App Component', () => {
    const mockUseLogWorker = useLogWorker as unknown as ReturnType<typeof vi.fn>;
    const mockUseAdb = useAdb as unknown as ReturnType<typeof vi.fn>;
    const mockUseFileDrop = useFileDrop as unknown as ReturnType<typeof vi.fn>;

    const defaultLogWorkerReturn = {
        addChunk: vi.fn(),
        clearLogs: vi.fn(),
        flushLogs: vi.fn(),
    };

    const defaultAdbReturn = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        isConnected: false,
        deviceName: null,
        startMock: vi.fn(),
    };

    const defaultFileDropReturn = {
        isDragging: false,
        handleDragOver: vi.fn(),
        handleDragLeave: vi.fn(),
        handleDrop: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup default mock implementations
        mockUseLogWorker.mockReturnValue(defaultLogWorkerReturn);
        mockUseAdb.mockReturnValue(defaultAdbReturn);
        mockUseFileDrop.mockReturnValue(defaultFileDropReturn);
    });

    it('renders landing page when disconnected and not viewing file', () => {
        renderWithProvider(<App />);

        // Should show landing text
        expect(screen.getByText('NEKOLOG')).toBeInTheDocument();

        // Should show start demo mode link
        expect(screen.getByText('Start Demo Mode')).toBeInTheDocument();

        // Should render ControlBar
        expect(screen.getByTestId('control-bar')).toBeInTheDocument();

        // Should not render LogList
        expect(screen.queryByTestId('log-list')).not.toBeInTheDocument();
    });

    it('renders LogList when connected', () => {
        mockUseAdb.mockReturnValue({
            ...defaultAdbReturn,
            isConnected: true,
            deviceName: 'test-device-id',
        });

        renderWithProvider(<App />);

        // Should not show landing text
        expect(screen.queryByText('NEKOLOG')).not.toBeInTheDocument();

        // Should not show start demo mode link
        expect(screen.queryByText('Start Demo Mode')).not.toBeInTheDocument();

        // Should render LogList
        expect(screen.getByTestId('log-list')).toBeInTheDocument();
    });

    it('renders LogList when viewing a file', async () => {
        const store = createStore();
        // Use the action atom to set the state instead of trying to write to a derived read-only atom
        const { startFileLoadAtom } = await import('@/store');
        store.set(startFileLoadAtom, 'test.log');

        renderWithProvider(<App />, store);

        // Should not show landing text
        expect(screen.queryByText('NEKOLOG')).not.toBeInTheDocument();

        // Should not show start demo mode link
        expect(screen.queryByText('Start Demo Mode')).not.toBeInTheDocument();

        // Should render LogList
        expect(screen.getByTestId('log-list')).toBeInTheDocument();
    });

    it('renders file drop overlay when dragging a file', () => {
        mockUseFileDrop.mockReturnValue({
            ...defaultFileDropReturn,
            isDragging: true,
        });

        renderWithProvider(<App />);

        expect(screen.getByText('Drop log file to open')).toBeInTheDocument();
    });

    it('calls startMock when Start Demo Mode is clicked', () => {
        const startMock = vi.fn();
        mockUseAdb.mockReturnValue({
            ...defaultAdbReturn,
            startMock,
        });

        renderWithProvider(<App />);

        const demoButton = screen.getByText('Start Demo Mode');
        fireEvent.click(demoButton);

        expect(startMock).toHaveBeenCalledTimes(1);
    });
});
