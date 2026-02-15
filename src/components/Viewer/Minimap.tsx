import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { LogEntry } from '@/types';
import type { Virtualizer } from '@tanstack/react-virtual';

interface MinimapProps {
    logs: LogEntry[];
    scrollElement: HTMLDivElement | null;
    totalSize: number;
    virtualizer: Virtualizer<HTMLDivElement, Element>;
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

export const Minimap: React.FC<MinimapProps> = ({ logs, scrollElement, totalSize, virtualizer }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const isDragging = useRef(false);
    const [tick, setTick] = useState(0);

    // Handle Resize to trigger redraw
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(() => setTick(t => t + 1));
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Draw the minimap
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || logs.length === 0 || totalSize === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { clientWidth, clientHeight } = container;
        canvas.width = clientWidth;
        canvas.height = clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Use the virtualizer's estimate to calculate pixel-based Y positions.
        // This keeps the minimap's coordinate system consistent with the scroll system.
        // For any item, its estimated pixel offset = index * estimateSize.
        // We then scale this to the canvas height using totalSize.
        const estimateSize = virtualizer.options.estimateSize(0);
        const scale = clientHeight / totalSize;

        logs.forEach((log, index) => {
            ctx.fillStyle = LEVEL_COLORS[log.level] || '#a6adc8';

            // Pixel-offset-based positioning using estimated row height
            const y = index * estimateSize * scale;
            const height = Math.max(1, estimateSize * scale);

            // Width proportional to message length
            const lengthRatio = Math.min(1, Math.max(0.2, log.message.length / MAX_LOG_LENGTH));
            const width = lengthRatio * clientWidth;

            ctx.fillRect(0, y, width, height);
        });
    }, [logs, tick, totalSize, virtualizer]);

    // Viewport indicator
    const [viewportState, setViewportState] = useState({ top: 0, height: 0 });

    const updateViewport = useCallback(() => {
        if (!scrollElement || totalSize === 0 || !containerRef.current) return;
        const { scrollTop, clientHeight: viewHeight } = scrollElement;
        const minimapHeight = containerRef.current.clientHeight;

        // Both use totalSize as the denominator, so viewport aligns with items
        const viewportTop = (scrollTop / totalSize) * minimapHeight;
        const viewportHeight = (viewHeight / totalSize) * minimapHeight;

        setViewportState({
            top: viewportTop,
            height: Math.max(viewportHeight, 4),
        });
    }, [scrollElement, totalSize]);

    useEffect(() => {
        if (!scrollElement) return;
        const onScroll = () => requestAnimationFrame(updateViewport);
        scrollElement.addEventListener('scroll', onScroll);
        updateViewport();
        return () => scrollElement.removeEventListener('scroll', onScroll);
    }, [scrollElement, updateViewport, logs.length, tick]);

    // Click / drag to scroll
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;

        const container = containerRef.current;
        const element = scrollElement;
        if (!container || !element) return;

        const jumpTo = (clientY: number) => {
            const rect = container.getBoundingClientRect();
            const pct = Math.max(0, Math.min((clientY - rect.top) / rect.height, 1));
            element.scrollTop = pct * (element.scrollHeight - element.clientHeight);
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

    return (
        <div
            ref={containerRef}
            className={`
                absolute right-0 top-0 bottom-0 z-20
                transition-all duration-200 ease-in-out
                bg-base/80 border-l border-white/5 backdrop-blur-sm
                ${isHovering ? 'w-24 opacity-100 shadow-xl' : 'w-2.5 opacity-60'}
            `}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseDown={handleMouseDown}
            style={{ cursor: 'pointer' }}
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full block pointer-events-none"
            />

            {/* Viewport Indicator */}
            <div
                className="absolute left-0 w-full bg-white/20 border-y border-white/40 pointer-events-none transition-all duration-75"
                style={{
                    top: viewportState.top,
                    height: viewportState.height,
                }}
            />
        </div>
    );
};
