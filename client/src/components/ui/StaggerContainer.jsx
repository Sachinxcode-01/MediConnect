import React from 'react';
import { motion } from 'framer-motion';

export const StaggerContainer = ({
  children,
  className = '',
  staggerDelay = 0.08,
  delayChildren = 0
}) => {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      exit="exit"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren
          }
        },
        exit: { opacity: 0 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({
  children,
  className = ''
}) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1]
          }
        },
        exit: { opacity: 0, y: -8 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default StaggerContainer;
