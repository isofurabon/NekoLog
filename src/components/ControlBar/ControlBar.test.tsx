import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Provider, createStore } from 'jotai';
import { ControlBar } from './ControlBar.tsx';
import {
    startFileLoadAtom,
    updateFileProgressAtom,
    finishFileLoadAtom
} from '@/store';
import React from 'react';

const renderWithProvider = (ui: React.ReactNode, store = createStore()) => {
    return {
        ...render(<Provider store={store}>{ui}</Provider>),
        store,
    };
};

describe('ControlBar Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const defaultProps = {
        deviceUniqueId: 'test-device',
        onConnect: vi.fn(),
        isConnected: false,
        onClear: vi.fn(),
    };

    it('renders default disconnected state', async () => {
        const store = createStore();
        renderWithProvider(<ControlBar {...defaultProps} />, store);

        expect(screen.getByText('test-device')).toBeInTheDocument();

        // Hover hint is only visible on hover
        const container = screen.getByTestId('control-bar-container');
        await userEvent.hover(container);

        await waitFor(() => {
            expect(screen.getByText('Click to connect')).toBeInTheDocument();
        });

        await userEvent.unhover(container);
    });

    it('renders connected state and handles click to expand', async () => {
        const store = createStore();
        renderWithProvider(<ControlBar {...defaultProps} isConnected />, store);

        expect(screen.getByText('test-device')).toBeInTheDocument();

        const container = screen.getByTestId('control-bar-container');
        await userEvent.hover(container);

        await waitFor(() => {
            expect(screen.getByText('Click to filter')).toBeInTheDocument();
        });

        // Find the clickable div (it has the rounded-full class initially)
        // We can just click the container's first child
        const clickArea = screen.queryByTestId('file-mode-click-area') || screen.getByTestId('control-bar-container').firstChild;
        await userEvent.click(clickArea as HTMLElement);

        // Wait for search input to appear (expansion)
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Filter logs... (Ctrl+K or Cmd+K)')).toBeInTheDocument();
        });
    });

    it('renders file viewing mode', async () => {
        const store = createStore();
        // Use action atoms instead of derived atoms
        store.set(startFileLoadAtom, 'test.log');
        store.set(finishFileLoadAtom);

        renderWithProvider(<ControlBar {...defaultProps} />, store);

        expect(screen.getByText('test.log')).toBeInTheDocument();

        const container = screen.getByTestId('control-bar-container');
        await userEvent.hover(container);

        await waitFor(() => {
            expect(screen.getByText('Click to filter')).toBeInTheDocument();
        });

        // Click to expand
        const clickArea = screen.queryByTestId('file-mode-click-area') || screen.getByTestId('control-bar-container').firstChild;
        await userEvent.click(clickArea as HTMLElement);

        // Wait for search input
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Filter logs... (Ctrl+K or Cmd+K)')).toBeInTheDocument();
        });
    });

    it('renders file loading mode', () => {
        const store = createStore();
        store.set(startFileLoadAtom, 'loading.log');
        store.set(updateFileProgressAtom, 50);

        renderWithProvider(<ControlBar {...defaultProps} />, store);

        expect(screen.getByText('loading.log')).toBeInTheDocument();

        // Since it's loading, we expect Cancel button to be present
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('handles keyboard shortcut Cmd/Ctrl + K to expand', async () => {
        const store = createStore();
        renderWithProvider(<ControlBar {...defaultProps} isConnected />, store);

        // Fire global keydown
        fireEvent.keyDown(globalThis, { key: 'k', ctrlKey: true });

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Filter logs... (Ctrl+K or Cmd+K)')).toBeInTheDocument();
        });
    });

    it('handles keyboard shortcut Escape to collapse', async () => {
        const store = createStore();
        renderWithProvider(<ControlBar {...defaultProps} isConnected />, store);

        const clickArea = screen.queryByTestId('file-mode-click-area') || screen.getByTestId('control-bar-container').firstChild;
        await userEvent.click(clickArea as HTMLElement);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Filter logs... (Ctrl+K or Cmd+K)')).toBeInTheDocument();
        });

        // Fire global Escape
        fireEvent.keyDown(globalThis, { key: 'Escape' });

        await waitFor(() => {
            expect(screen.queryByPlaceholderText('Filter logs... (Ctrl+K or Cmd+K)')).not.toBeInTheDocument();
        });
    });

    it('collapses when clicking outside', async () => {
        const store = createStore();
        renderWithProvider(
            <div data-testid="outside">
                <ControlBar {...defaultProps} isConnected />
            </div>
            , store
        );

        const clickArea = screen.queryByTestId('file-mode-click-area') || screen.getByTestId('control-bar-container').firstChild;
        await userEvent.click(clickArea as HTMLElement);

        await waitFor(() => {
            expect(screen.getByPlaceholderText('Filter logs... (Ctrl+K or Cmd+K)')).toBeInTheDocument();
        });

        // Click outside
        await userEvent.click(screen.getByTestId('outside'));

        await waitFor(() => {
            expect(screen.queryByPlaceholderText('Filter logs... (Ctrl+K or Cmd+K)')).not.toBeInTheDocument();
        });
    });
});
