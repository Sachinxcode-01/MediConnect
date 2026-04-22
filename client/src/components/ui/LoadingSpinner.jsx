import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Loading Spinner with multiple variants
 */
const LoadingSpinner = ({
  size = 'md',
  variant = 'default',
  text,
  fullScreen = false,
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const variants = {
    default: 'border-themePrimary border-t-transparent',
    white: 'border-white border-t-transparent',
    dual: 'border-themePrimary border-t-themeDeep',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className={`rounded-full ${sizes[size]} ${variants[variant]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-themeDeep font-bold text-sm animate-pulse"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-themeLight/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * Page Loading State
 */
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="flex h-screen items-center justify-center bg-themeLight">
    <div className="text-center">
      <motion.div
        className="w-16 h-16 border-4 border-themePrimary border-t-transparent rounded-full mx-auto mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-themeDeep font-black text-lg"
      >
        {message}
      </motion.p>
    </div>
  </div>
);

/**
 * Skeleton Loader for content placeholders
 */
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-themeMedium/20 rounded ${className}`} />
);

/**
 * Card Skeleton for dashboard placeholders
 */
export const CardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white p-6 rounded-[2rem] shadow-glass border border-themeMedium/30">
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-20" />
      </div>
    ))}
  </div>
);

export default LoadingSpinner;
