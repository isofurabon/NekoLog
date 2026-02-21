import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { LogEntry } from '@/types';

interface MinimapProps {
    logs: LogEntry[];
    scrollElement: HTMLDivElement | null;
    totalSize: number;
    onScrollToIndex: (index: number) => void;
    visibleLineRange: { startIndex: number; endIndex: number };
}

const LEVEL_COLORS: Record<string, string> = {
    V: '#6c7086', // overlay0/gray-500
    D: '#9399b2', // overlay2/gray-400
    I: '#a6adc8', // subtext0
    W: '#f9e2af', // yellow
    E: '#f38ba8', // red
    F: '#cba6f7', // mauve
};

const MAX_LOG_LENGTH = 200;
const LINE_HEIGHT_PX = 4; // 4px per log line

/**
 * Custom Hook: Handle container resize observation
 */
function useResizeTick(containerRef: React.RefObject<HTMLDivElement | null>) {
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!containerRef.current) return;

        let animationFrameId: number;
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(() => setTick(t => t + 1));
        });

        observer.observe(containerRef.current);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, [containerRef]);

    return tick;
}

/**
 * Custom Hook: Maintain viewport dimensions and scale math
 */
function useViewportState(
    scrollElement: HTMLDivElement | null,
    containerRef: React.RefObject<HTMLDivElement | null>,
    indicatorRef: React.RefObject<HTMLDivElement | null>,
    logsCount: number,
    visibleLineRange: { startIndex: number; endIndex: number },
    tick: number,
    totalSize: number
) {
    const [minimapScrollTop, setMinimapScrollTop] = useState(0);

    const updateViewport = useCallback(() => {
        if (!scrollElement || logsCount === 0 || !containerRef.current) return;

        const { clientHeight, scrollHeight, scrollTop } = scrollElement;
        const maxEditorScrollTop = Math.max(0, scrollHeight - clientHeight);
        const scrollRatio = maxEditorScrollTop > 0 ? scrollTop / maxEditorScrollTop : 0;

        const minimapScrollHeight = logsCount * LINE_HEIGHT_PX;
        const maxMinimapScrollTop = Math.max(0, minimapScrollHeight - containerRef.current.clientHeight);
        const nextMinimapScrollTop = scrollRatio * maxMinimapScrollTop;

        let top = visibleLineRange.startIndex * LINE_HEIGHT_PX - nextMinimapScrollTop;
        let bottom = (visibleLineRange.endIndex + 1) * LINE_HEIGHT_PX - nextMinimapScrollTop;

        // Clamp visually so the indicator never pushes out of the container bounds
        const containerHeight = containerRef.current.clientHeight;
        top = Math.max(0, top);
        bottom = Math.min(containerHeight, bottom);

        const height = Math.max(bottom - top, 4);

        // Update DOM directly for maximum smoothness bypassing React render tick
        if (indicatorRef.current) {
            indicatorRef.current.style.transform = `translateY(${top}px)`;
            indicatorRef.current.style.height = `${height}px`;
        }

        setMinimapScrollTop(nextMinimapScrollTop);
    }, [scrollElement, logsCount, visibleLineRange, containerRef, indicatorRef]);

    useEffect(() => {
        if (!scrollElement) return;

        let frameId: number;
        const onScroll = () => {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(updateViewport);
        };

        scrollElement.addEventListener('scroll', onScroll);
        updateViewport();

        return () => {
            scrollElement.removeEventListener('scroll', onScroll);
            cancelAnimationFrame(frameId);
        };
    }, [scrollElement, updateViewport, totalSize, tick]);

    return minimapScrollTop;
}

/**
 * Custom Hook: Render the canvas using the DOM and proportional state
 */
function useMinimapDraw(
    canvasRef: React.RefObject<HTMLCanvasElement | null>,
    containerRef: React.RefObject<HTMLDivElement | null>,
    logs: LogEntry[],
    minimapScrollTop: number,
    tick: number
) {
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || logs.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { clientWidth, clientHeight } = container;
        canvas.width = clientWidth;
        canvas.height = clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const count = logs.length;
        const itemHeight = LINE_HEIGHT_PX;

        const startIndex = Math.max(0, Math.floor(minimapScrollTop / LINE_HEIGHT_PX));
        const endIndex = Math.min(count, Math.ceil((minimapScrollTop + clientHeight) / LINE_HEIGHT_PX));

        for (let i = startIndex; i < endIndex; i++) {
            const log = logs[i];
            ctx.fillStyle = LEVEL_COLORS[log.level] || '#a6adc8';

            const y = i * LINE_HEIGHT_PX - minimapScrollTop;
            const lengthRatio = Math.min(1, Math.max(0.2, log.message.length / MAX_LOG_LENGTH));
            const width = lengthRatio * clientWidth;

            ctx.fillRect(0, y, width, itemHeight);
        }
    }, [canvasRef, containerRef, logs, tick, minimapScrollTop]);
}

/**
 * Custom Hook: Bind interactions like Drag mapping and Scrolling
 */
function useMinimapInteraction(
    containerRef: React.RefObject<HTMLDivElement | null>,
    scrollElement: HTMLDivElement | null,
    logsCount: number,
    minimapScrollTop: number,
    onScrollToIndex: (index: number) => void
) {
    const isDragging = useRef(false);
    const scrollStateRef = useRef(minimapScrollTop);

    useEffect(() => {
        scrollStateRef.current = minimapScrollTop;
    }, [minimapScrollTop]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;

        const container = containerRef.current;
        if (!container || !scrollElement) return;

        const jumpTo = (clientY: number) => {
            const rect = container.getBoundingClientRect();
            const clickY = Math.max(0, Math.min(clientY - rect.top, rect.height));

            const minimapScrollHeight = logsCount * LINE_HEIGHT_PX;

            if (minimapScrollHeight <= rect.height) {
                const targetIndex = Math.floor(clickY / LINE_HEIGHT_PX);
                onScrollToIndex(Math.max(0, Math.min(targetIndex, logsCount - 1)));
            } else {
                const absoluteY = clickY + scrollStateRef.current;
                const targetIndex = Math.floor(absoluteY / LINE_HEIGHT_PX);
                onScrollToIndex(Math.max(0, Math.min(targetIndex, logsCount - 1)));
            }
        };

        jumpTo(e.clientY);

        const onMove = (ev: MouseEvent) => {
            if (isDragging.current) jumpTo(ev.clientY);
        };

        const onUp = () => {
            isDragging.current = false;
            globalThis.removeEventListener('mousemove', onMove);
            globalThis.removeEventListener('mouseup', onUp);
        };

        globalThis.addEventListener('mousemove', onMove);
        globalThis.addEventListener('mouseup', onUp);
    }, [containerRef, scrollElement, logsCount, onScrollToIndex]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!scrollElement) return;
        scrollElement.scrollTop += e.deltaY;
    }, [scrollElement]);

    return { handleMouseDown, handleWheel };
}

export const Minimap: React.FC<MinimapProps> = ({ logs, scrollElement, totalSize, onScrollToIndex, visibleLineRange }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    // Modularized hook logic
    const tick = useResizeTick(containerRef);
    const minimapScrollTop = useViewportState(scrollElement, containerRef, indicatorRef, logs.length, visibleLineRange, tick, totalSize);

    useMinimapDraw(canvasRef, containerRef, logs, minimapScrollTop, tick);

    const { handleMouseDown, handleWheel } = useMinimapInteraction(containerRef, scrollElement, logs.length, minimapScrollTop, onScrollToIndex);

    return (
        <div
            ref={containerRef}
            className={`
                absolute right-0 top-0 bottom-0 z-20
                transition-all duration-200 ease-out
                bg-base/80 border-l border-white/5 backdrop-blur-sm
                ${isHovering ? 'w-24 opacity-100 shadow-xl' : 'w-2.5 opacity-60'}
            `}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
            style={{ cursor: 'pointer' }}
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full block pointer-events-none"
            />

            {/* Viewport Indicator */}
            <div
                ref={indicatorRef}
                className="absolute left-0 w-full bg-white/40 border-y border-white/60 pointer-events-none"
                style={{
                    top: 0,
                    // Use standard inline style for transform performance
                    willChange: 'transform, height'
                }}
            />
        </div>
    );
};
