import React from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Card Component with glassmorphism and hover effects
 */
const Card = ({
  children,
  className = '',
  hover = true,
  onClick,
  padding = 'md',
  ...props
}) => {
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  return (
    <motion.div
      onClick={onClick}
      className={`
        bg-white
        rounded-[2rem]
        shadow-glass
        border border-themeMedium/30
        ${paddingStyles[padding]}
        ${hover ? 'hover-3d transition-all duration-500 cursor-default' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      whileHover={hover ? { scale: 1.01, y: -5 } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Card Header Component
 */
export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-6 ${className}`}>{children}</div>
);

/**
 * Card Title Component
 */
export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-black text-themeDeep ${className}`}>{children}</h3>
);

/**
 * Card Description Component
 */
export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-themeDark/70 font-medium mt-1 ${className}`}>{children}</p>
);

/**
 * Card Content Component
 */
export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

/**
 * Card Footer Component
 */
export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-6 pt-6 border-t border-themeMedium/20 ${className}`}>{children}</div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
