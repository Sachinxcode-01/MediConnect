import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const AnimatedCard = ({
  children,
  className = '',
  hoverElevate = true,
  onClick,
  ...props
}) => {
  return (
    <motion.div
      whileHover={hoverElevate ? { y: -4, transition: { duration: 0.2, ease: 'easeOut' } } : undefined}
      onClick={onClick}
      className={cn(
        "bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden group",
        onClick && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
