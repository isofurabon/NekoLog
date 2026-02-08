import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Smartphone } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { DeviceStatus } from './DeviceStatus.tsx';
import { LogSearch } from './LogSearch.tsx';
import { LogActions } from './LogActions.tsx';
import { MarqueeText } from './MarqueeText.tsx';
import { useClickOutside } from '@/hooks/useClickOutside.ts';

interface ControlBarProps {
    deviceUniqueId?: string;
    onConnect: () => void;
    isConnected: boolean;
    onClear: () => void;
}

export const ControlBar = ({
    deviceUniqueId,
    onConnect,
    isConnected,
    onClear
}: ControlBarProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Click outside to collapse
    const handleCollapse = useCallback(() => setIsExpanded(false), []);
    useClickOutside(containerRef, handleCollapse, isExpanded);

    // Keyboard shortcut Cmd/Ctrl+K & Escape
    // if the devie is conencted, open the search bar, otherwise nothing happens
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isConnected) {
                    setIsExpanded(true);
                    setTimeout(() => inputRef.current?.focus(), 100);
                }
            }
            if (e.key === 'Escape' && isExpanded) {
                setIsExpanded(false);
            }
        };
        globalThis.addEventListener('keydown', handleGlobalKeyDown);
        return () => globalThis.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isExpanded]);

    const toggleExpand = () => {
        if (!isExpanded) {
            setIsExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleCloseSearch = () => {
        setIsExpanded(false);
    };

    return (
        <div className="absolute top-8 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
            <div
                ref={containerRef}
                className="relative flex flex-col items-center pointer-events-auto group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <motion.div
                    layout
                    initial={false}
                    animate={{
                        backgroundColor: isExpanded ? "rgba(49, 50, 68, 0.9)" : "rgba(49, 50, 68, 0.9)",
                        paddingLeft: isExpanded ? 0 : 16,
                        paddingRight: isExpanded ? 0 : 16
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={clsx(
                        "shadow-xl backdrop-blur-md border border-white/10 flex items-center relative z-20",
                        isExpanded
                            ? "w-[600px] h-12 rounded-xl overflow-visible"
                            : "w-auto h-10 rounded-full hover:bg-surface1 cursor-pointer active:scale-95 overflow-hidden"
                    )}
                    onClick={!isExpanded ? (isConnected ? toggleExpand : onConnect) : undefined}
                >
                    <AnimatePresence mode="wait">
                        {!isExpanded ? (
                            <div className="relative h-full flex items-center justify-center">
                                {/* Device Status - always present for layout width, fades out on hover */}
                                <motion.div
                                    animate={{
                                        opacity: isHovered ? 0 : 1,
                                        y: isHovered ? -10 : 0
                                    }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center"
                                >
                                    <DeviceStatus
                                        deviceUniqueId={deviceUniqueId}
                                        isConnected={isConnected}
                                    />
                                </motion.div>

                                {/* Hint Overlay - absolute positioned */}
                                <AnimatePresence>
                                    {isHovered && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute inset-0 flex items-center justify-center pointer-events-none px-4"
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                {isConnected ? (
                                                    <>
                                                        <Search size={14} className="text-gray-300 shrink-0" strokeWidth={3} />
                                                        <div className="min-w-0 flex-1 overflow-hidden">
                                                            <MarqueeText
                                                                text="Click to filter"
                                                                isHovered={isHovered}
                                                                className="text-sm font-medium text-gray-300"
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Smartphone size={14} className="text-blue-400 shrink-0" strokeWidth={2.5} />
                                                        <div className="min-w-0 flex-1 overflow-hidden">
                                                            <MarqueeText
                                                                text="Click to connect"
                                                                isHovered={isHovered}
                                                                className="text-sm font-medium text-blue-400"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <motion.div
                                key="search"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="w-full h-full"
                            >
                                <LogSearch
                                    onClose={handleCloseSearch}
                                    inputRef={inputRef}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <LogActions
                    isExpanded={isExpanded}
                    onClear={onClear}
                    isHovered={isHovered}
                />
            </div>
        </div>
    );
};
