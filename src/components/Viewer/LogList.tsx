import { useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAtom, useAtomValue } from 'jotai';
import { filteredLogsAtom, autoScrollAtom, filterTextAtom } from '@/store';
import { LogRow } from './LogRow.tsx';
import { Minimap } from './Minimap.tsx';

export const LogList = () => {
    const logs = useAtomValue(filteredLogsAtom);
    const filterText = useAtomValue(filterTextAtom);
    const [autoScroll, setAutoScroll] = useAtom(autoScrollAtom);
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
    const lastInteractionTime = useRef(0);

    const rowVirtualizer = useVirtualizer({
        count: logs.length,
        getScrollElement: () => scrollElement,
        estimateSize: () => 24, // Estimate row height
        overscan: 10,
    });

    const markInteraction = () => {
        lastInteractionTime.current = Date.now();
    };

    // Auto-scroll logic
    useEffect(() => {
        // If autoscroll is on, always try to scroll to bottom when size/count changes
        if (autoScroll && logs.length > 0) {
            rowVirtualizer.scrollToIndex(logs.length - 1, { align: 'end' });
        }
    }, [logs.length, autoScroll, rowVirtualizer, rowVirtualizer.getTotalSize()]);

    // Detect user scroll to disable autoscroll
    const handleScroll = () => {
        if (!scrollElement) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        // Check if we are close to bottom
        const distanceToBottom = Math.abs(scrollHeight - scrollTop - clientHeight);
        const isAtBottom = distanceToBottom < 50;

        // Check if user interacted recently (within 200ms)
        const isUserInteracting = (Date.now() - lastInteractionTime.current) < 200;

        // Only disable autoscroll if we are NOT at bottom AND it was caused by user interaction
        if (!isAtBottom && autoScroll && isUserInteracting) {
            setAutoScroll(false);
        }
    };

    return (
        <div
            className="flex-1 w-full overflow-hidden relative bg-base p-4"
            role="log"
            onWheel={markInteraction}
            onMouseDown={markInteraction}
            onTouchStart={markInteraction}
            onKeyDown={markInteraction}
        >
            <div className="h-full w-full rounded-xl border border-white/5 bg-crust/30 overflow-hidden relative">
                <Minimap
                    logs={logs}
                    scrollElement={scrollElement}
                    totalSize={rowVirtualizer.getTotalSize()}
                    virtualizer={rowVirtualizer}
                />
                <div
                    ref={setScrollElement}
                    className="h-full w-full overflow-y-auto scrollbar-none px-2"
                    onScroll={handleScroll}
                >
                    <div
                        style={{
                            height: `${rowVirtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
                            <LogRow
                                key={virtualRow.key}
                                log={logs[virtualRow.index]}
                                index={virtualRow.index}
                                filterText={filterText}
                                measureRef={rowVirtualizer.measureElement}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
