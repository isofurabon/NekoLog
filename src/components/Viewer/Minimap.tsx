import React, { useRef, useEffect, useState } from 'react';
import type { LogEntry } from '@/types';

interface MinimapProps {
    logs: LogEntry[];
    scrollElement: HTMLDivElement | null;
    totalSize: number;
}

const LEVEL_COLORS: Record<string, string> = {
    V: '#a6adc8', // subtext0
    D: '#89b4fa', // blue
    I: '#a6e3a1', // green
    W: '#f9e2af', // yellow
    E: '#f38ba8', // red
    F: '#cba6f7', // mauve (fatal)
};

export const Minimap: React.FC<MinimapProps> = ({ logs, scrollElement, totalSize }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const isDragging = useRef(false);
    const [tick, setTick] = useState(0); // Force redraw on resize

    // Handle Resize to redraw canvas
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(() => {
            setTick(t => t + 1);
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Draw the minimap
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

        // Simple approximation: draw every log as a small line
        // If logs.length > clientHeight, we are effectively downsampling
        const itemHeight = Math.max(1, clientHeight / logs.length);

        logs.forEach((log, index) => {
            const color = LEVEL_COLORS[log.level] || '#a6adc8';
            ctx.fillStyle = color;

            const y = (index / logs.length) * clientHeight;
            ctx.fillRect(0, y, clientWidth, itemHeight);
        });

    }, [logs, tick]); // Redraw on log change or resize

    // Viewport Indicator Overlay
    const [viewportState, setViewportState] = useState({ top: 0, height: 0 });

    const updateViewport = () => {
        if (!scrollElement || totalSize === 0) return;
        const { scrollTop, clientHeight } = scrollElement;

        const minimapHeight = containerRef.current?.clientHeight || 0;

        // Map exact scroll pixels to minimap pixels
        const viewportTop = (scrollTop / totalSize) * minimapHeight;
        const viewportHeight = (clientHeight / totalSize) * minimapHeight;

        setViewportState({
            top: viewportTop,
            height: Math.max(viewportHeight, 4) // Minimum visibility
        });
    };

    useEffect(() => {
        if (!scrollElement) return;

        const handleScroll = () => {
            requestAnimationFrame(updateViewport);
        };

        scrollElement.addEventListener('scroll', handleScroll);
        updateViewport(); // Initial

        return () => scrollElement.removeEventListener('scroll', handleScroll);
    }, [scrollElement, totalSize, logs.length, tick]); // Update when layout changes


    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;

        // Initial jump
        const container = containerRef.current;
        const element = scrollElement;
        if (!container || !element) return;

        const rect = container.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const percentage = Math.max(0, Math.min(clickY / rect.height, 1));

        // Scroll to that percentage of TOTAL content
        // element.scrollHeight should be approx totalSize (from virtualizer)
        // But let's use element.scrollHeight to be safe as that's what scrollTop operates on
        // Wait, virtualizer sets a spacer div with height=totalSize. So scrollHeight IS totalSize.
        element.scrollTop = percentage * (element.scrollHeight - element.clientHeight);

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;

            const rect = container.getBoundingClientRect();
            const relativeY = e.clientY - rect.top;
            const percentage = Math.max(0, Math.min(relativeY / rect.height, 1));

            element.scrollTop = percentage * (element.scrollHeight - element.clientHeight);
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            globalThis.removeEventListener('mousemove', handleMouseMove);
            globalThis.removeEventListener('mouseup', handleMouseUp);
        };

        globalThis.addEventListener('mousemove', handleMouseMove);
        globalThis.addEventListener('mouseup', handleMouseUp);
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
