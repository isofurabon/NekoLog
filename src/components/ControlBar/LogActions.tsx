import { ArrowDown, Download, Trash2, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { useAtom } from 'jotai';
import { autoScrollAtom, filteredLogsAtom } from '@/store';
import { downloadLogs } from '@/utils/download.ts';

interface ActionButtonProps {
    onClick: () => void;
    icon: LucideIcon;
    iconSize?: number;
    title: string;
    colorClass: string;
    hoverColorClass: string;
    isActive?: boolean;
    activeClass?: string;
}

const ActionButton = ({
    onClick,
    icon: Icon,
    iconSize = 16,
    title,
    colorClass,
    hoverColorClass,
    isActive = false,
    activeClass = ''
}: ActionButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        className={clsx(
            "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 border border-white/10 active:scale-95",
            isActive ? activeClass : `bg-surface0 ${colorClass} ${hoverColorClass}`
        )}
        title={title}
    >
        <Icon size={iconSize} className={clsx("transition-transform duration-300", isActive && "translate-y-0.5")} />
    </button>
);

interface LogActionsProps {
    isExpanded: boolean;
    onClear: () => void;
    isHovered: boolean;
}

export const LogActions = ({ isExpanded, onClear, isHovered }: LogActionsProps) => {
    const [autoScroll, setAutoScroll] = useAtom(autoScrollAtom);
    const [logs] = useAtom(filteredLogsAtom);

    const handleDownload = () => {
        downloadLogs(logs, { format: 'txt' });
    };

    return (
        <AnimatePresence>
            {!isExpanded && isHovered && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex items-center gap-3 z-10 mt-2 pointer-events-auto"
                >
                    <ActionButton
                        onClick={() => setAutoScroll(!autoScroll)}
                        icon={ArrowDown}
                        iconSize={18}
                        title="Toggle Auto-scroll"
                        colorClass="text-gray-400"
                        hoverColorClass="hover:bg-surface1 hover:text-gray-300"
                        isActive={autoScroll}
                        activeClass="bg-blue-500 text-base border-blue-500 hover:bg-blue-400"
                    />

                    <ActionButton
                        onClick={handleDownload}
                        icon={Download}
                        title="Download Logs"
                        colorClass="text-green-400"
                        hoverColorClass="hover:bg-green-500 hover:text-base"
                    />

                    <ActionButton
                        onClick={onClear}
                        icon={Trash2}
                        title="Clear Logs"
                        colorClass="text-red-400"
                        hoverColorClass="hover:bg-red-500 hover:text-base"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
