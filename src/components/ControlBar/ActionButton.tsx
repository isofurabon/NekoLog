import { type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

export interface ActionButtonProps {
    onClick: () => void;
    icon: LucideIcon;
    iconSize?: number;
    title: string;
    colorClass: string;
    hoverColorClass: string;
    isActive?: boolean;
    activeClass?: string;
}

export const ActionButton = ({
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
