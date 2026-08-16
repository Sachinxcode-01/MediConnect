import React from 'react';
import { motion } from 'framer-motion';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30 rounded-xl border border-blue-400/30",
        secondary: "bg-slate-900 text-slate-100 hover:bg-slate-800 rounded-xl border border-slate-800 shadow-md",
        outline: "bg-transparent text-slate-200 border border-slate-800 hover:border-blue-500 hover:text-white rounded-xl",
        ghost: "bg-transparent text-slate-300 hover:bg-slate-900 hover:text-white rounded-xl",
        danger: "bg-red-600 text-white hover:bg-red-500 rounded-xl shadow-md",
        glass: "bg-slate-900/80 backdrop-blur-md border border-slate-800 text-white hover:bg-slate-900 rounded-xl shadow-sm"
      },
      size: {
        sm: "px-3.5 py-1.5 text-xs tracking-wide",
        md: "px-5 py-2.5 text-sm tracking-wide",
        lg: "px-7 py-3.5 text-base tracking-wide font-black",
        icon: "h-10 w-10 p-0 rounded-xl"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

export const AnimatedButton = ({
  children,
  className,
  variant,
  size,
  isLoading = false,
  isDisabled = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  ...props
}) => {
  return (
    <motion.button
      type={type}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />}
        </>
      )}
    </motion.button>
  );
};

export default AnimatedButton;
