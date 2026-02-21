import { motion } from 'motion/react';
import { FileText, X } from 'lucide-react';

interface FileLoadingContentProps {
    fileName: string | null;
    progress: number;
    onCancel: (e: React.MouseEvent) => void;
}

/** Loading state content — filename, percentage, and cancel button.
 *  The actual progress fill is rendered as a background layer in the main container. */
export const FileLoadingContent = ({
    fileName,
    progress,
    onCancel,
}: FileLoadingContentProps) => (
    <motion.div
        key="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full flex items-center gap-3 px-2 relative z-10"
    >
        <FileText size={18} className="text-blue-200 shrink-0" />
        <div className="flex-1 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-blue-100 truncate max-w-[400px]">
                {fileName}
            </span>
            <span className="text-xs text-blue-200/80 tabular-nums shrink-0">
                {progress}%
            </span>
        </div>
        <button
            type="button"
            onClick={onCancel}
            className="p-1 hover:bg-white/10 text-blue-200/60 hover:text-red-300 rounded-full transition-colors"
        >
            <X size={16} />
        </button>
    </motion.div>
);
