import { memo } from 'react';

interface HighlightedTextProps {
    text: string;
    highlight?: string;
}

export const HighlightedText = memo(({ text, highlight }: HighlightedTextProps) => {
    if (!highlight || highlight.length === 0) return <>{text}</>;

    // Escape special regex characters
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));

    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-500/40 text-yellow-100 rounded-sm px-0.5">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
});

HighlightedText.displayName = 'HighlightedText';
