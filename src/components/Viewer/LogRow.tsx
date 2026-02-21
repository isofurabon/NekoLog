import { memo } from 'react';
import type { LogEntry } from '@/types';
import { getLevelColor, getBgHoverColor } from '@/utils/color.ts';
import { ColumnWidths } from '@/constants/layout.ts';
import type { SearchableField } from '@/constants/search.ts';
import { clsx } from 'clsx';

interface LogRowProps {
    log: LogEntry;
    index: number;
    style: React.CSSProperties; // For virtualization
    measureRef?: (element: HTMLElement | null) => void;
    filterText?: string;
    includedFields?: SearchableField[];
}

const HighlightedText = ({ text, highlight }: { text: string; highlight?: string }) => {
    if (!highlight || highlight.length === 0) return <>{text}</>;

    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));

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
};

export const LogRow = memo(({ log, index, style, measureRef, filterText, includedFields }: LogRowProps) => {
    const colorClass = getLevelColor(log.level);
    const hoverClass = getBgHoverColor(log.level);

    return (
        <div
            ref={measureRef}
            style={style}
            data-index={index} // Helpful for debugging virtualizer
            className={clsx(
                "flex text-sm font-mono items-baseline border-l pl-2 py-0.5 transition-colors duration-75 cursor-default select-text",
                colorClass,
                hoverClass
            )}
        >
            {/* Timestamp */}
            <span style={{ width: ColumnWidths.Timestamp }} className="shrink-0 select-text text-left line-clamp-1">
                <HighlightedText text={String(log.timestamp)} highlight={includedFields?.includes('timestamp') ? filterText : undefined} />
            </span>

            {/* PID/TID */}
            <span style={{ width: ColumnWidths.PidTid }} className="shrink-0 select-text hidden text-left sm:inline-block">
                <HighlightedText text={String(log.pid)} highlight={includedFields?.includes('pid') ? filterText : undefined} />/
                <HighlightedText text={String(log.tid)} highlight={includedFields?.includes('tid') ? filterText : undefined} />
            </span>

            {/* Level */}
            <span style={{ width: ColumnWidths.Level }} className="shrink-0 font-bold select-none">
                <HighlightedText text={String(log.level)} highlight={includedFields?.includes('level') ? filterText : undefined} />
            </span>

            {/* Tag */}
            <span style={{ width: ColumnWidths.Tag, marginRight: '2ch' }} className="shrink-0 font-semibold truncate select-text text-right" title={log.tag}>
                <HighlightedText text={String(log.tag)} highlight={includedFields?.includes('tag') ? filterText : undefined} />:
            </span>

            {/* Message */}
            <span className="flex-1 whitespace-pre-wrap break-all select-text text-left leading-relaxed">
                <HighlightedText text={String(log.message)} highlight={includedFields?.includes('message') ? filterText : undefined} />
            </span>
        </div>
    );
});

LogRow.displayName = 'LogRow';
