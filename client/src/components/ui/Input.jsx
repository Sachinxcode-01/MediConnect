import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Input Component with icon support and validation states
 */
const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  helperText,
  className = '',
  wrapperClassName = '',
  required = false,
  ...props
}, ref) => {
  return (
    <div className={`space-y-2 ${wrapperClassName}`}>
      {label && (
        <label className="flex items-center gap-2 text-[10px] font-black text-themeDeep uppercase tracking-widest ml-1">
          {label}
          {required && <span className="text-themePrimary">*</span>}
        </label>
      )}
      <div className="relative group/input">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-themeDark/40 group-focus-within/input:text-themePrimary transition-colors z-10">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-themeLight/50 border-2 rounded-2xl
            ${Icon ? 'pl-12' : 'px-4'} pr-4 py-3.5
            text-themeDeep font-bold
            placeholder-themeDark/30
            focus:outline-none
            focus:border-themePrimary
            focus:bg-white
            transition-all
            shadow-inner
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-themeMedium/30'}
            ${className}
          `}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-xs font-bold ml-1 ${error ? 'text-red-500' : 'text-themeDark/50'}`}
        >
          {error || helperText}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
