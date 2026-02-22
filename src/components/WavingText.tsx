import { motion } from 'motion/react';

export const WavingText = ({ text }: { text: string }) => {
  const letters = Array.from(text);
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const letterVariants = {
    initial: { y: 0, color: 'rgba(192, 132, 252, 0.6)' },
    animate: {
      y: [0, -12, 0],
      color: ['rgba(192, 132, 252, 0.6)', 'rgba(192, 132, 252, 1)', 'rgba(192, 132, 252, 0.6)'],
      textShadow: ['0px 0px 0px rgba(192, 132, 252, 0)', '0px 0px 12px rgba(192, 132, 252, 0.6)', '0px 0px 0px rgba(192, 132, 252, 0)'],
      transition: { duration: 1.5, repeat: Infinity, repeatDelay: 8, ease: "easeInOut" as const },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="text-sm font-bold tracking-[0.3em] text-purple-400/60 uppercase flex"
    >
      {letters.map((char, index) => (
        <motion.span
          key={index}
          variants={letterVariants}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {char}
        </motion.span>
      ))}
    </motion.div>
  );
};
