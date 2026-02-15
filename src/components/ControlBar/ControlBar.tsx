import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Smartphone, FileText, X } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { DeviceStatus } from './DeviceStatus.tsx';
import { LogSearch } from './LogSearch.tsx';
import { useAtom } from 'jotai';
import { isViewingFileAtom, currentFileNameAtom, isLoadingFileAtom, loadingProgressAtom } from '@/store';

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

    // File Mode State
    const [isViewingFile] = useAtom(isViewingFileAtom);
    const [currentFileName] = useAtom(currentFileNameAtom);
    const [isLoadingFile, setIsLoadingFile] = useAtom(isLoadingFileAtom);
    const [loadingProgress] = useAtom(loadingProgressAtom);

    // Click outside to collapse
    const handleCollapse = useCallback(() => setIsExpanded(false), []);
    useClickOutside(containerRef, handleCollapse, isExpanded);

    // Keyboard shortcut Cmd/Ctrl+K & Escape
    // if the devie is conencted, open the search bar, otherwise nothing happens
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isConnected && !isViewingFile) {
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
    }, [isExpanded, isConnected, isViewingFile]);

    const toggleExpand = () => {
        if (!isExpanded) {
            setIsExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleCloseSearch = () => {
        setIsExpanded(false);
    };

    const handleCancelLoading = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Just stop loading UI state, the worker might still processing remaining chunks but app won't freeze
        // Ideally we should tell the App to stop reading.
        // For this iteration, we set loading to false.
        setIsLoadingFile(false);
    };

    // If viewing file, we might want to auto-expand to show progress, or just show it in collapsed state?
    // Requirement: "when opening file, control bar is expanded and loading progress will be shown in control bar"
    useEffect(() => {
        if (isLoadingFile) {
            setIsExpanded(true);
        }
    }, [isLoadingFile]);

    return (
        <div className="absolute top-8 left-0 right-0 z-50 flex flex-col items-center pointer-events-none">
            <div
                ref={containerRef}
                data-testid="control-bar-container"
                className="relative flex flex-col items-center pointer-events-auto group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >

                <motion.div
                    layout
                    initial={false}
                    animate={{
                        backgroundColor: "rgba(49, 50, 68, 0.9)",
                        paddingLeft: isExpanded || isViewingFile ? 16 : 16, // Adjust padding
                        paddingRight: isExpanded || isViewingFile ? 16 : 16
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={clsx(
                        "shadow-xl backdrop-blur-md border border-white/10 flex items-center relative z-20",
                        isExpanded
                            ? "w-[600px] h-12 rounded-xl overflow-visible"
                            : "w-auto h-10 rounded-full hover:bg-surface1 cursor-pointer active:scale-95 overflow-hidden"
                    )}
                    onClick={!isExpanded && !isViewingFile ? (isConnected ? toggleExpand : onConnect) : undefined}
                >
                    <AnimatePresence mode="wait">
                        {isViewingFile && isExpanded && isLoadingFile ? (
                            // Loading State
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full flex items-center gap-3 px-2"
                            >
                                <FileText size={18} className="text-blue-400 shrink-0" />
                                <div className="flex-1 flex flex-col justify-center gap-1">
                                    <div className="text-xs text-gray-400 flex justify-between">
                                        <span className="truncate max-w-[300px]">{currentFileName}</span>
                                        <span>{loadingProgress}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-surface0 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-blue-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${loadingProgress}%` }}
                                            transition={{ ease: "linear" }}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleCancelLoading}
                                    className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </motion.div>
                        ) : isViewingFile ? (
                            // File Mode (Loaded or Collapsed Loading)
                            <motion.div
                                key="file-mode"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 justify-center w-full"
                                onClick={toggleExpand}
                            >
                                <FileText size={14} className="text-blue-400 shrink-0" />
                                <span className="text-sm font-medium text-blue-100 truncate max-w-[400px]">
                                    {currentFileName}
                                </span>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        className="border-l border-white/10 pl-3 ml-1 flex-1"
                                    >
                                        <LogSearch
                                            onClose={handleCloseSearch}
                                            inputRef={inputRef}
                                        />
                                    </motion.div>
                                )}
                            </motion.div>

                        ) : !isExpanded ? (
                            // Standard Collapsed State
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
                            // Standard Expanded Search State
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
                    isHovered={isHovered || isLoadingFile} // Keep actions visible during loading if needed, or maybe not? Spec doesn't say.
                />
            </div>
        </div>
    );
};
