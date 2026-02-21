import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { LogEntry } from '@/types';
import type { Virtualizer } from '@tanstack/react-virtual';

interface MinimapProps {
    logs: LogEntry[];
    scrollElement: HTMLDivElement | null;
    totalSize: number;
    virtualizer: Virtualizer<HTMLDivElement, Element>;
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

export const Minimap: React.FC<MinimapProps> = ({ logs, scrollElement, totalSize, virtualizer, visibleLineRange }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const isDragging = useRef(false);
    const [tick, setTick] = useState(0);

    // Handle Resize to trigger redraw
    useEffect(() => {
        if (!containerRef.current) return;

        let animationFrameId: number;
        const observer = new ResizeObserver(() => {
            // Throttle resize updates to animation frames
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(() => {
                setTick(t => t + 1);
            });
        });

        observer.observe(containerRef.current);
        return () => {
            observer.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Draw the minimap — pure index-based coordinate system
    // Every item is evenly spaced: y = (index / count) * canvasHeight
    // This always fills the canvas regardless of totalSize changes.
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

        for (let i = 0; i < count; i++) {
            const log = logs[i];
            ctx.fillStyle = LEVEL_COLORS[log.level] || '#a6adc8';

            const y = i * LINE_HEIGHT_PX;

            // Width proportional to message length
            const lengthRatio = Math.min(1, Math.max(0.2, log.message.length / MAX_LOG_LENGTH));
            const width = lengthRatio * clientWidth;

            ctx.fillRect(0, y, width, itemHeight);
        }
    }, [logs, tick]);

    // Viewport indicator — uses virtualizer.getVirtualItems() to find which
    // indices are currently visible, then maps those to the same index-based
    // coordinate system used for drawing items.
    const [viewportState, setViewportState] = useState({ top: 0, height: 0 });

    const updateViewport = useCallback(() => {
        if (!scrollElement || logs.length === 0 || !containerRef.current) return;

        // Map indices to the same coordinate system as drawn items
        const top = visibleLineRange.startIndex * LINE_HEIGHT_PX;
        const bottom = (visibleLineRange.endIndex + 1) * LINE_HEIGHT_PX;

        console.log(visibleLineRange);

        setViewportState({
            top,
            height: Math.max(bottom - top, 4),
        });
    }, [scrollElement, logs.length, visibleLineRange]);

    useEffect(() => {
        if (!scrollElement) return;
        const onScroll = () => requestAnimationFrame(updateViewport);
        scrollElement.addEventListener('scroll', onScroll);

        // Also update when virtual rules change (e.g. range changes due to window resize or data update)
        updateViewport();

        return () => scrollElement.removeEventListener('scroll', onScroll);
    }, [scrollElement, updateViewport, totalSize, tick, virtualizer.isScrolling]); // Add virtualizer.isScrolling to force updates during rapid scrolling

    // Click / drag to scroll — reverse-map from minimap coordinate to item index
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;

        const container = containerRef.current;
        if (!container) return;

        const jumpTo = (clientY: number) => {
            const rect = container.getBoundingClientRect();
            const pct = Math.max(0, Math.min((clientY - rect.top) / rect.height, 1));
            // Map percentage to an item index and scroll there
            const targetIndex = Math.floor(pct * logs.length);
            virtualizer.scrollToIndex(targetIndex, { align: 'center' });
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
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!scrollElement) return;
        // Pass the wheel event delta directly to the scroll element
        scrollElement.scrollTop += e.deltaY;
    };

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
                className="absolute left-0 w-full bg-white/40 border-y border-white/60 pointer-events-none transition-all duration-75"
                style={{
                    top: viewportState.top,
                    height: viewportState.height,
                }}
            />
        </div>
    );
};
