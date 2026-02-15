import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Provider, createStore } from 'jotai';
import { LogSearch } from './LogSearch.tsx';
import { filterTextAtom } from '@/store';
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

        // X button should appear (first button is the clear button)
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it('clears filter on clear button click', async () => {
        const user = userEvent.setup();
        const store = createStore();
        const inputRef = React.createRef<HTMLInputElement>();

        renderWithProvider(<LogSearch onClose={vi.fn()} inputRef={inputRef} />, store);

        const input = screen.getByPlaceholderText(/filter logs/i);
        await user.type(input, 'search text');

        // First button is the clear button (X icon)
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

        onClose.mockClear(); // Clear any previous calls
        fireEvent.blur(input);

        expect(onClose).not.toHaveBeenCalled();
    });
});
