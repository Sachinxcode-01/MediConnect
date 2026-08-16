import React from 'react';
import { motion } from 'framer-motion';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md hover:shadow-emerald-500/20 rounded-2xl border border-emerald-500/30",
        secondary: "bg-slate-900 text-white hover:bg-slate-800 rounded-2xl border border-slate-700/50 shadow-md",
        outline: "bg-transparent text-slate-800 border-2 border-slate-200 hover:bg-slate-100/50 rounded-2xl",
        ghost: "bg-transparent text-slate-700 hover:bg-slate-100 rounded-xl",
        danger: "bg-red-600 text-white hover:bg-red-500 rounded-2xl shadow-md",
        glass: "bg-white/80 backdrop-blur-md border border-slate-200/80 text-slate-900 hover:bg-white rounded-2xl shadow-sm"
      },
      size: {
        sm: "px-3.5 py-1.5 text-xs tracking-wide",
        md: "px-5 py-2.5 text-sm tracking-wide",
        lg: "px-7 py-3.5 text-base tracking-wide font-black",
        icon: "h-10 w-10 p-0 rounded-2xl"
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
