import { memo } from 'react';
import type { LogEntry } from '@/types';
import { getLevelColor, getBgHoverColor } from '@/utils/color.ts';
import { ColumnWidths } from '@/constants/layout.ts';
import { clsx } from 'clsx';

interface LogRowProps {
    log: LogEntry;
    index: number;
    style: React.CSSProperties; // For virtualization
    measureRef?: (element: HTMLElement | null) => void;
    filterText?: string;
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

export const LogRow = memo(({ log, index, style, measureRef, filterText }: LogRowProps) => {
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
            <span style={{ width: ColumnWidths.Timestamp }} className="shrink-0 select-text text-left line-clamp-1">{log.timestamp}</span>

            {/* PID/TID */}
            <span style={{ width: ColumnWidths.PidTid }} className="shrink-0 select-text hidden text-left sm:inline-block">
                {log.pid}/{log.tid}
            </span>

            {/* Level */}
            <span style={{ width: ColumnWidths.Level }} className="shrink-0 font-bold select-none">{log.level}</span>

            {/* Tag */}
            <span style={{ width: ColumnWidths.Tag, marginRight: '2ch' }} className="shrink-0 font-semibold truncate select-text text-right" title={log.tag}>
                <HighlightedText text={log.tag} highlight={filterText} />:
            </span>

            {/* Message */}
            <span className="flex-1 whitespace-pre-wrap break-all select-text text-left leading-relaxed">
                <HighlightedText text={log.message} highlight={filterText} />
            </span>
        </div>
    );
});

LogRow.displayName = 'LogRow';
