import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Provider, createStore } from 'jotai';
import { LogSearch } from './LogSearch.tsx';
import { filterTextAtom, includedFieldsAtom } from '@/store';
import { SEARCHABLE_FIELDS } from '@/constants/search.ts';
import React from 'react';

const renderWithProvider = (ui: React.ReactNode, store = createStore()) => {
    return {
        ...render(<Provider store={store}>{ui}</Provider>),
        store,
    };
};

describe('LogSearch Component', () => {
    it('renders search input', () => {
        const inputRef = React.createRef<HTMLInputElement>();
        renderWithProvider(<LogSearch onClose={vi.fn()} inputRef={inputRef} />);

        expect(screen.getByPlaceholderText(/filter logs/i)).toBeInTheDocument();
    });

    it('focuses input on mount', async () => {
        const inputRef = React.createRef<HTMLInputElement>();
        renderWithProvider(<LogSearch onClose={vi.fn()} inputRef={inputRef} />);

        // Wait for the focus timeout
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(document.activeElement).toBe(inputRef.current);
    });

    it('calls onClose on Escape key', () => {
        const onClose = vi.fn();
        const inputRef = React.createRef<HTMLInputElement>();
        renderWithProvider(<LogSearch onClose={onClose} inputRef={inputRef} />);

        const input = screen.getByPlaceholderText(/filter logs/i);
        fireEvent.keyDown(input, { key: 'Escape' });

        expect(onClose).toHaveBeenCalled();
    });

    it('updates filter text on input', async () => {
        const user = userEvent.setup();
        const store = createStore();
        const inputRef = React.createRef<HTMLInputElement>();

        renderWithProvider(<LogSearch onClose={vi.fn()} inputRef={inputRef} />, store);

        const input = screen.getByPlaceholderText(/filter logs/i);
        await user.type(input, 'test filter');

        expect(store.get(filterTextAtom)).toBe('test filter');
    });

    it('shows clear button when filter has text', async () => {
        const user = userEvent.setup();
        const inputRef = React.createRef<HTMLInputElement>();

        renderWithProvider(<LogSearch onClose={vi.fn()} inputRef={inputRef} />);

        const input = screen.getByPlaceholderText(/filter logs/i);
        await user.type(input, 'search text');

        // Check that at least two buttons are present (Filter button + Clear button)
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('clears filter on clear button click', async () => {
        const user = userEvent.setup();
        const store = createStore();
        const inputRef = React.createRef<HTMLInputElement>();

        renderWithProvider(<LogSearch onClose={vi.fn()} inputRef={inputRef} />, store);

        const input = screen.getByPlaceholderText(/filter logs/i);
        await user.type(input, 'search text');

        // The clear button appears before the filter button in the DOM order
        const buttons = screen.getAllByRole('button');
        const clearButton = buttons[0];
        await user.click(clearButton);

        expect(store.get(filterTextAtom)).toBe('');
    });

    it('calls onClose on blur when filter is empty', () => {
        const onClose = vi.fn();
        const inputRef = React.createRef<HTMLInputElement>();

        renderWithProvider(<LogSearch onClose={onClose} inputRef={inputRef} />);

        const input = screen.getByPlaceholderText(/filter logs/i);
        fireEvent.blur(input);

        expect(onClose).toHaveBeenCalled();
    });

    it('does not call onClose on blur when filter has text', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        const inputRef = React.createRef<HTMLInputElement>();

        renderWithProvider(<LogSearch onClose={onClose} inputRef={inputRef} />);

        const input = screen.getByPlaceholderText(/filter logs/i);
        await user.type(input, 'has text');

        onClose.mockClear();
        fireEvent.blur(input);

        expect(onClose).not.toHaveBeenCalled();
    });

    describe('FilterMenu Interaction', () => {
        it('toggles filter menu on button click', async () => {
            const user = userEvent.setup();
            const inputRef = React.createRef<HTMLInputElement>();
            renderWithProvider(<LogSearch onClose={vi.fn()} inputRef={inputRef} />);

            const filterButton = screen.getByTitle('Filter Fields');

            // Menu should be closed initially
            expect(screen.queryByText('message')).not.toBeInTheDocument();

            // Click to open
            await user.click(filterButton);
            expect(screen.getByText('message')).toBeInTheDocument();

            // Click to close
            await user.click(filterButton);
            await waitFor(() => {
                expect(screen.queryByText('message')).not.toBeInTheDocument();
            });
        });

        it('renders all searchable fields in the menu', async () => {
            const user = userEvent.setup();
            const inputRef = React.createRef<HTMLInputElement>();
            renderWithProvider(<LogSearch onClose={vi.fn()} inputRef={inputRef} />);

            const filterButton = screen.getByTitle('Filter Fields');
            await user.click(filterButton);

            SEARCHABLE_FIELDS.forEach(field => {
                expect(screen.getByText(field)).toBeInTheDocument();
            });
        });

        it('updates included fields when checkboxes are toggled', async () => {
            const user = userEvent.setup();
            const store = createStore();
            const inputRef = React.createRef<HTMLInputElement>();

            // Initialize with only 'message' included
            store.set(includedFieldsAtom, ['message']);

            renderWithProvider(<LogSearch onClose={vi.fn()} inputRef={inputRef} />, store);

            const filterButton = screen.getByTitle('Filter Fields');
            await user.click(filterButton);

            // Toggle 'tag' on
            const tagLabel = screen.getByText('tag');
            await user.click(tagLabel);
            expect(store.get(includedFieldsAtom)).toContain('tag');
            expect(store.get(includedFieldsAtom)).toContain('message');

            // Toggle 'message' off
            const messageLabel = screen.getByText('message');
            await user.click(messageLabel);
            expect(store.get(includedFieldsAtom)).not.toContain('message');
            expect(store.get(includedFieldsAtom)).toContain('tag');
        });

        it('closes menu when clicking outside', async () => {
            const user = userEvent.setup();
            const inputRef = React.createRef<HTMLInputElement>();
            renderWithProvider(<LogSearch onClose={vi.fn()} inputRef={inputRef} />);

            const filterButton = screen.getByTitle('Filter Fields');
            await user.click(filterButton);

            expect(screen.getByText('message')).toBeInTheDocument();

            // Click outside (e.g., on the input which is outside the menu)
            const input = screen.getByPlaceholderText(/filter logs/i);
            await user.click(input);

            await waitFor(() => {
                expect(screen.queryByText('message')).not.toBeInTheDocument();
            });
        });
    });
});
