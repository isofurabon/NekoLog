import { motion } from 'motion/react';
import { FileText, Search } from 'lucide-react';
import { HoverHint } from './HoverHint.tsx';

interface FileModeCollapsedProps {
    fileName: string | null;
    isHovered: boolean;
    onExpand: (e?: React.MouseEvent) => void;
}

/** Collapsed file-mode state showing filename with hover-to-filter hint */
export const FileModeCollapsed = ({
    fileName,
    isHovered,
    onExpand,
}: FileModeCollapsedProps) => (
    <div
        className="relative w-full h-full flex items-center justify-center cursor-pointer"
        onClick={onExpand}
        data-testid="file-mode-click-area"
    >
        <motion.div
            key="file-mode-info"
            initial={{ opacity: 0 }}
            animate={{
                opacity: isHovered ? 0 : 1,
                y: isHovered ? -10 : 0,
            }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 justify-center w-full"
        >
            <FileText size={14} className="text-blue-400 shrink-0" />
            <span className="text-sm font-medium text-blue-100 truncate max-w-[400px]">
                {fileName}
            </span>
        </motion.div>

        <HoverHint
            icon={Search}
            text="Click to filter"
            isHovered={isHovered}
            iconClassName="text-gray-300 shrink-0"
            textClassName="text-sm font-medium text-gray-300"
        />
    </div>
);
