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
      whileHover={hoverElevate ? { y: -2, transition: { duration: 0.2, ease: 'easeOut' } } : undefined}
      onClick={onClick}
      className={cn(
        "bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-md hover:shadow-2xl hover:border-blue-500/40 transition-all duration-200 relative overflow-hidden group text-slate-100",
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
