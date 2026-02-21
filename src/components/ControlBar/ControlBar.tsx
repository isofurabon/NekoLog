import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Smartphone } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { DeviceStatus } from './DeviceStatus.tsx';
import { LogSearch } from './LogSearch.tsx';
import { useAtomValue, useSetAtom } from 'jotai';
import { isViewingFileAtom, currentFileNameAtom, isLoadingFileAtom, loadingProgressAtom, cancelFileLoadAtom } from '@/store';
import { LogActions } from './LogActions.tsx';
import { useClickOutside } from '@/hooks/useClickOutside.ts';

// Sub-components extracted to separate files
import { HoverHint } from './HoverHint.tsx';
import { FileLoadingContent } from './FileLoadingContent.tsx';
import { ProgressFill } from './ProgressFill.tsx';
import { FileModeCollapsed } from './FileModeCollapsed.tsx';

// --- Main Component ---

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
    onClear,
}: ControlBarProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // File Mode State (read-only)
    const isViewingFile = useAtomValue(isViewingFileAtom);
    const currentFileName = useAtomValue(currentFileNameAtom);
    const isLoadingFile = useAtomValue(isLoadingFileAtom);
    const loadingProgress = useAtomValue(loadingProgressAtom);
    const cancelFileLoad = useSetAtom(cancelFileLoadAtom);

    // Click outside to collapse (but not while loading)
    const handleCollapse = useCallback(() => {
        if (!isLoadingFile) setIsExpanded(false);
    }, [isLoadingFile]);
    useClickOutside(containerRef, handleCollapse, isExpanded || isLoadingFile);

    // Reliably focus the search input after expand animation
    const focusSearchInput = useCallback(() => {
        // Try immediately, then retry until the input is available
        const tryFocus = (attempts = 0) => {
            if (inputRef.current) {
                inputRef.current.focus();
            } else if (attempts < 10) {
                setTimeout(() => tryFocus(attempts + 1), 50);
            }
        };
        // Initial delay to let React render cycle complete
        setTimeout(() => tryFocus(), 50);
    }, []);

    // Keyboard shortcut Cmd/Ctrl+K & Escape
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if ((isConnected || isViewingFile) && !isLoadingFile) {
                    setIsExpanded(true);
                    focusSearchInput();
                }
            }
            if (e.key === 'Escape' && isExpanded) {
                setIsExpanded(false);
            }
        };
        globalThis.addEventListener('keydown', handleGlobalKeyDown);
        return () => globalThis.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isExpanded, isConnected, isViewingFile, isLoadingFile, focusSearchInput]);

    const toggleExpand = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();
        if (!isExpanded) {
            setIsExpanded(true);
            focusSearchInput();
        }
    }, [isExpanded, focusSearchInput]);

    const handleCloseSearch = useCallback(() => {
        setIsExpanded(false);
    }, []);

    const handleCancelLoading = (e: React.MouseEvent) => {
        e.stopPropagation();
        cancelFileLoad();
    };

    // Auto-expand/collapse effect removed to prevent race conditions.
    // Visual state is now derived directly from (isExpanded || isLoadingFile).

    // Determine the content to render inside the bar
    const renderBarContent = () => {
        // 1) File loading in progress (Overrides everything)
        if (isLoadingFile) {
            return (
                <FileLoadingContent
                    fileName={currentFileName}
                    progress={loadingProgress}
                    onCancel={handleCancelLoading}
                />
            );
        }

        // 2) File mode — collapsed: show filename, expanded: show search
        if (isViewingFile) {
            return !isExpanded ? (
                <FileModeCollapsed
                    fileName={currentFileName}
                    isHovered={isHovered}
                    onExpand={toggleExpand}
                />
            ) : (
                <motion.div
                    key="file-mode-search"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
                >
                    <LogSearch onClose={handleCloseSearch} inputRef={inputRef} />
                </motion.div>
            );
        }

        // 3) Standard collapsed: device status + hover hints
        if (!isExpanded) {
            return (
                <div className="relative h-full flex items-center justify-center">
                    <motion.div
                        animate={{
                            opacity: isHovered ? 0 : 1,
                            y: isHovered ? -10 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center"
                    >
                        <DeviceStatus
                            deviceUniqueId={deviceUniqueId}
                            isConnected={isConnected}
                        />
                    </motion.div>

                    <HoverHint
                        icon={isConnected ? Search : Smartphone}
                        text={isConnected ? 'Click to filter' : 'Click to connect'}
                        isHovered={isHovered}
                        iconClassName={isConnected ? 'text-gray-300 shrink-0' : 'text-blue-400 shrink-0'}
                        textClassName={isConnected ? 'text-sm font-medium text-gray-300' : 'text-sm font-medium text-blue-400'}
                    />
                </div>
            );
        }

        // 4) Standard expanded: search input
        return (
            <motion.div
                key="search"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
            >
                <LogSearch onClose={handleCloseSearch} inputRef={inputRef} />
            </motion.div>
        );
    };

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
                        backgroundColor: isLoadingFile ? "rgba(30, 40, 70, 0.95)" : "rgba(49, 50, 68, 0.9)",
                        paddingLeft: 16,
                        paddingRight: 16,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={clsx(
                        "shadow-xl backdrop-blur-md border flex items-center relative z-20",
                        (isExpanded || isLoadingFile)
                            ? "w-[600px] h-12 rounded-xl overflow-visible border-white/10"
                            : "w-auto h-10 rounded-full hover:bg-surface1 cursor-pointer active:scale-95 overflow-hidden border-white/10",
                        isLoadingFile && "overflow-hidden border-blue-500/30" // Override for loading style
                    )}
                    onClick={!isExpanded && !isLoadingFile && !isViewingFile ? (isConnected ? toggleExpand : onConnect) : undefined}
                >
                    {/* Progress fill background — only visible during loading */}
                    {isLoadingFile && <ProgressFill progress={loadingProgress} />}

                    <AnimatePresence mode="wait" initial={false}>
                        {renderBarContent()}
                    </AnimatePresence>
                </motion.div>

                <LogActions
                    isExpanded={isExpanded || isLoadingFile}
                    onClear={onClear}
                    isHovered={isHovered}
                />
            </div>
        </div>
    );
};
