import { motion } from 'motion/react';

interface ProgressFillProps {
    progress: number;
}

/** Background fill that represents loading progress inside the control bar */
export const ProgressFill = ({ progress }: ProgressFillProps) => {
    const mappedProgress = Math.pow(progress / 100, 0.5) * 100;

    return (<motion.div
        className="absolute inset-0 rounded-xl bg-blue-500/90"
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: `inset(0 ${100 - mappedProgress}% 0 0)` }}
        transition={{ ease: 'linear', duration: 0.15 }}
    />);
};
