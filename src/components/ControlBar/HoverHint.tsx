import { motion, AnimatePresence } from 'motion/react';
import { Search } from 'lucide-react';
import { MarqueeText } from './MarqueeText.tsx';

interface HoverHintProps {
    icon: typeof Search;
    text: string;
    isHovered: boolean;
    iconClassName: string;
    textClassName: string;
}

/** Hover hint overlay shared between file-mode and connected-mode collapsed states */
export const HoverHint = ({
    icon: Icon,
    text,
    isHovered,
    iconClassName,
    textClassName,
}: HoverHintProps) => (
    <AnimatePresence>
        {isHovered && (
            <motion.div
                key="hint-overlay"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none px-4"
            >
                <div className="flex items-center gap-2 w-full">
                    <Icon size={14} className={iconClassName} strokeWidth={3} />
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <MarqueeText
                            text={text}
                            isHovered={isHovered}
                            className={textClassName}
                        />
                    </div>
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);
