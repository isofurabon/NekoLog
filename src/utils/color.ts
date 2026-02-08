import type { LogLevel } from '@/types';

const LEVEL_COLORS: Record<LogLevel, string> = {
    E: 'text-red-500 border-red-500',
    W: 'text-yellow-500 border-yellow-500',
    I: 'text-gray-300 border-gray-300',
    D: 'text-gray-400 border-gray-400',
    V: 'text-gray-500 border-gray-500',
    F: 'text-purple-500 border-purple-500',
};

const BG_HOVER_COLORS: Record<LogLevel, string> = {
    E: 'hover:bg-red-500/10',
    W: 'hover:bg-yellow-500/10',
    I: 'hover:bg-gray-500/10',
    D: 'hover:bg-gray-500/10',
    V: 'hover:bg-gray-500/10',
    F: 'hover:bg-purple-500/10',
};

export const getLevelColor = (level: LogLevel): string =>
    LEVEL_COLORS[level] ?? 'text-gray-400 border-gray-400';

export const getBgHoverColor = (level: LogLevel): string =>
    BG_HOVER_COLORS[level] ?? 'hover:bg-white/5';

