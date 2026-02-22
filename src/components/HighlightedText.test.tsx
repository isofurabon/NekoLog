import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HighlightedText } from './HighlightedText.tsx';

describe('HighlightedText Component', () => {
    it('renders text without highlight when no highlight prop is provided', () => {
        render(<HighlightedText text="Hello World" />);
        expect(screen.getByText('Hello World')).toBeInTheDocument();
        expect(screen.queryByText((_content, element) => element?.tagName.toLowerCase() === 'mark')).not.toBeInTheDocument();
    });

    it('renders text without highlight when highlight prop is empty', () => {
        render(<HighlightedText text="Hello World" highlight="" />);
        expect(screen.getByText('Hello World')).toBeInTheDocument();
        expect(screen.queryByText((_content, element) => element?.tagName.toLowerCase() === 'mark')).not.toBeInTheDocument();
    });

    it('highlights matching text case-insensitively', () => {
        render(<HighlightedText text="Hello World" highlight="hello" />);
        const mark = screen.getByText('Hello');
        expect(mark.tagName).toBe('MARK');
        expect(mark).toHaveClass('bg-yellow-500/40');
    });

    it('highlights multiple occurrences', () => {
        render(<HighlightedText text="foo bar foo" highlight="foo" />);
        const marks = screen.getAllByText('foo');
        expect(marks).toHaveLength(2);
        marks.forEach(mark => {
            expect(mark.tagName).toBe('MARK');
        });
    });

    it('handles regex special characters safely', () => {
        const text = "Method (abc) called";
        const highlight = "(abc)";
        render(<HighlightedText text={text} highlight={highlight} />);

        const mark = screen.getByText('(abc)');
        expect(mark.tagName).toBe('MARK');
    });

    it('does not crash with partial regex characters', () => {
        const text = "Error [Test]";
        const highlight = "[";
        render(<HighlightedText text={text} highlight={highlight} />);

        const mark = screen.getByText('[');
        expect(mark.tagName).toBe('MARK');
    });

    it('renders non-matching parts correctly around highlight', () => {
        const { container } = render(<HighlightedText text="PrefixMatchSuffix" highlight="Match" />);
        expect(screen.getByText('Match')).toHaveClass('bg-yellow-500/40');
        expect(container).toHaveTextContent('PrefixMatchSuffix');
    });
});
