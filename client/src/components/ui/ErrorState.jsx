import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { AnimatedButton } from './AnimatedButton';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-8 bg-red-50/70 border border-red-200/80 rounded-3xl text-center max-w-lg mx-auto flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-lg font-black text-slate-900">{title}</h4>
        <p className="text-xs font-medium text-slate-600 mt-1">{message}</p>
      </div>
      {onRetry && (
        <AnimatedButton onClick={onRetry} variant="danger" size="sm" icon={RefreshCw}>
          Try Again
        </AnimatedButton>
      )}
    </motion.div>
  );
};

export default ErrorState;
