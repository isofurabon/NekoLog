import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LogRow } from './LogRow.tsx';
import type { LogEntry } from '@/types';

const createMockLog = (overrides: Partial<LogEntry> = {}): LogEntry => ({
    id: 'test-id',
    timestamp: '01-15 10:30:45.123',
    pid: '1234',
    tid: '5678',
    level: 'I',
    tag: 'TestTag',
    message: 'Test message content',
    ...overrides,
});

describe('LogRow Component', () => {
    const defaultStyle: React.CSSProperties = { height: 24 };

    it('renders all log fields', () => {
        const log = createMockLog();
        render(<LogRow log={log} index={0} style={defaultStyle} />);

        expect(screen.getByText('01-15 10:30:45.123')).toBeInTheDocument();
        expect(screen.getByText('1234/5678')).toBeInTheDocument();
        expect(screen.getByText('I')).toBeInTheDocument();
        expect(screen.getByText('TestTag:')).toBeInTheDocument();
        expect(screen.getByText('Test message content')).toBeInTheDocument();
    });

    it('applies correct color class for Error level', () => {
        const log = createMockLog({ level: 'E' });
        const { container } = render(<LogRow log={log} index={0} style={defaultStyle} />);

        const row = container.firstChild;
        expect(row).toHaveClass('text-red-500');
        expect(row).toHaveClass('border-red-500');
    });

    it('applies correct color class for Warning level', () => {
        const log = createMockLog({ level: 'W' });
        const { container } = render(<LogRow log={log} index={0} style={defaultStyle} />);

        const row = container.firstChild;
        expect(row).toHaveClass('text-yellow-500');
        expect(row).toHaveClass('border-yellow-500');
    });

    it('applies correct color class for Debug level', () => {
        const log = createMockLog({ level: 'D' });
        const { container } = render(<LogRow log={log} index={0} style={defaultStyle} />);

        const row = container.firstChild;
        expect(row).toHaveClass('text-gray-400');
        expect(row).toHaveClass('border-gray-400');
    });

    it('applies hover classes', () => {
        const log = createMockLog({ level: 'E' });
        const { container } = render(<LogRow log={log} index={0} style={defaultStyle} />);

        const row = container.firstChild;
        expect(row).toHaveClass('hover:bg-red-500/10');
    });

    it('sets data-index attribute for debugging', () => {
        const log = createMockLog();
        const { container } = render(<LogRow log={log} index={5} style={defaultStyle} />);

        const row = container.firstChild;
        expect(row).toHaveAttribute('data-index', '5');
    });

    it('handles long messages', () => {
        const longMessage = 'A'.repeat(500);
        const log = createMockLog({ message: longMessage });
        render(<LogRow log={log} index={0} style={defaultStyle} />);

        expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles special characters in tag', () => {
        const log = createMockLog({ tag: 'com.app.MyClass$Inner' });
        render(<LogRow log={log} index={0} style={defaultStyle} />);

        expect(screen.getByText('com.app.MyClass$Inner:')).toBeInTheDocument();
    });
});
