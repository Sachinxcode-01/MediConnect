import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedButton } from './AnimatedButton';

export const EmptyState = ({
  icon: Icon,
  title = 'No records found',
  description = 'There are currently no items to display.',
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`py-16 px-6 text-center max-w-md mx-auto flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      {Icon && (
        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 mb-2 border border-slate-200">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-xl font-black text-slate-900">{title}</h3>
      <p className="text-sm font-medium text-slate-500 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <AnimatedButton onClick={onAction} variant="primary" size="md">
            {actionLabel}
          </AnimatedButton>
        </div>
      )}
    </motion.div>
  );
};

export default EmptyState;
