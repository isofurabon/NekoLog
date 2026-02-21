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
    const [clampState, setClampState] = useState<{ isClampedTop: boolean; isClampedBottom: boolean; hiddenRows: number }>({
        isClampedTop: false,
        isClampedBottom: false,
        hiddenRows: 0
    });

    const updateViewport = useCallback(() => {
        if (!scrollElement || logsCount === 0 || !containerRef.current) return;

        const { clientHeight, scrollHeight, scrollTop } = scrollElement;
        const maxEditorScrollTop = Math.max(0, scrollHeight - clientHeight);
        const scrollRatio = maxEditorScrollTop > 0 ? scrollTop / maxEditorScrollTop : 0;

        const minimapScrollHeight = logsCount * LINE_HEIGHT_PX;
        const maxMinimapScrollTop = Math.max(0, minimapScrollHeight - containerRef.current.clientHeight);
        const nextMinimapScrollTop = scrollRatio * maxMinimapScrollTop;

        const rawTop = visibleLineRange.startIndex * LINE_HEIGHT_PX - nextMinimapScrollTop;
        const rawBottom = (visibleLineRange.endIndex + 1) * LINE_HEIGHT_PX - nextMinimapScrollTop;

        // Clamp visually so the indicator never pushes out of the container bounds
        const containerHeight = containerRef.current.clientHeight;

        // Check for clamping
        const isClampedTop = rawTop < 0;
        const isClampedBottom = rawBottom > containerHeight;

        let top = Math.max(0, rawTop);
        const bottom = Math.min(containerHeight, rawBottom);

        const minHeight = (isClampedTop || isClampedBottom) ? 12 : 4;
        let height = bottom - top;

        // Ensure the indicator is thick enough to easily grab/hover when clamped
        if (height < minHeight) {
            height = Math.min(minHeight, containerHeight); // Don't overflow tiny containers
            if (isClampedBottom && !isClampedTop) {
                top = Math.max(0, bottom - height);
            }
        }

        let hiddenRows = 0;
        if (isClampedTop) {
            const minimapStartIdx = Math.floor(nextMinimapScrollTop / LINE_HEIGHT_PX);
            hiddenRows = visibleLineRange.startIndex - minimapStartIdx; // Negative value
        } else if (isClampedBottom) {
            const minimapEndIdx = Math.floor((nextMinimapScrollTop + containerHeight) / LINE_HEIGHT_PX);
            hiddenRows = visibleLineRange.endIndex - minimapEndIdx; // Positive value
        }

        // Update DOM directly for maximum smoothness bypassing React render tick
        if (indicatorRef.current) {
            indicatorRef.current.style.transform = `translateY(${top}px)`;
            indicatorRef.current.style.height = `${height}px`;
        }

        setMinimapScrollTop(nextMinimapScrollTop);
        setClampState({ isClampedTop, isClampedBottom, hiddenRows: Math.abs(hiddenRows) });
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

    return { minimapScrollTop, clampState };
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
 * Custom Hook: Handle rendering popup sub-canvas when zoomed out heavily
 */
function usePopupCanvasDraw(
    popupCanvasRef: React.RefObject<HTMLCanvasElement | null>,
    logs: LogEntry[],
    startIndex: number,
    endIndex: number,
    isHoveringPopup: boolean
) {
    useEffect(() => {
        const canvas = popupCanvasRef.current;
        if (!canvas || logs.length === 0 || !isHoveringPopup) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = 120; // Fixed width for popup
        const height = (endIndex - startIndex + 1) * LINE_HEIGHT_PX;

        // Enforce maximum height for canvas safety, matching CSS
        canvas.width = width;
        canvas.height = Math.min(height, 200);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const itemHeight = LINE_HEIGHT_PX;

        for (let i = startIndex; i <= endIndex; i++) {
            if (i >= logs.length) break;
            const log = logs[i];
            ctx.fillStyle = LEVEL_COLORS[log.level] || '#a6adc8';

            const y = (i - startIndex) * LINE_HEIGHT_PX;
            if (y > 200) break; // Don't draw past max popout height

            const lengthRatio = Math.min(1, Math.max(0.2, log.message.length / MAX_LOG_LENGTH));
            const rectWidth = lengthRatio * width;

            ctx.fillRect(0, y, rectWidth, itemHeight);
        }
    }, [popupCanvasRef, logs, startIndex, endIndex, isHoveringPopup]);
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
    const popupCanvasRef = useRef<HTMLCanvasElement>(null);

    const [isHovering, setIsHovering] = useState(false);
    const [isHoveringIndicator, setIsHoveringIndicator] = useState(false);

    // Modularized hook logic
    const tick = useResizeTick(containerRef);
    const { minimapScrollTop, clampState } = useViewportState(scrollElement, containerRef, indicatorRef, logs.length, visibleLineRange, tick, totalSize);

    useMinimapDraw(canvasRef, containerRef, logs, minimapScrollTop, tick);

    const isClamped = clampState.isClampedTop || clampState.isClampedBottom;
    const isPopupVisible = isHoveringIndicator && isClamped;
    usePopupCanvasDraw(popupCanvasRef, logs, visibleLineRange.startIndex, visibleLineRange.endIndex, isPopupVisible);

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
                className={`
                    absolute left-0 w-full border-y pointer-events-auto
                    duration-200
                    ${isClamped
                        ? (isHoveringIndicator ? 'border-yellow-400 bg-yellow-500/40 shadow-[0_0_12px_rgba(234,179,8,0.4)]' : 'border-yellow-400/60 bg-yellow-500/20')
                        : (isHoveringIndicator ? 'border-white bg-white/50' : 'border-white/60 bg-white/40')
                    }
                `}
                style={{
                    top: 0,
                    // Specific CSS transition to prevent position easing
                    transitionProperty: 'background-color, border-color, box-shadow',
                    willChange: 'transform, height'
                }}
                onMouseEnter={() => setIsHoveringIndicator(true)}
                onMouseLeave={() => setIsHoveringIndicator(false)}
            >
                {/* Extruded Popup */}
                <div
                    className={`
                        absolute right-full mr-2 pointer-events-none z-30
                        bg-base/95 border border-white/10 rounded overflow-hidden shadow-2xl backdrop-blur-md
                        flex flex-col origin-right
                        transition-all duration-200 ease-out
                        ${isPopupVisible ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-95 translate-x-1'}
                    `}
                    style={{
                        // Anchor top if clamped top, anchor bottom if clamped bottom
                        // Default to top if neither so it doesn't jump during fade out
                        top: clampState.isClampedBottom ? 'auto' : 0,
                        bottom: clampState.isClampedBottom ? 0 : 'auto',
                        maxHeight: '200px'
                    }}
                >
                    <div className="text-xs px-2 py-1 border-b border-white/5 bg-white/5 text-subtext0 flex items-center gap-1 font-mono">
                        {clampState.isClampedBottom ? '↓' : '↑'} {clampState.hiddenRows} lines
                    </div>
                    <canvas ref={popupCanvasRef} className="opacity-90 max-h-full" />
                </div>
            </div>
        </div>
    );
};
