import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Premium Button Component with multiple variants
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
  iconPosition = 'left',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-black rounded-2xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none';

  const variants = {
    primary: 'bg-themePrimary text-white shadow-neon hover:shadow-neon-hover hover:-translate-y-1 hover:bg-themePrimary/90 border border-transparent',
    secondary: 'bg-white text-themeDeep border-2 border-themeMedium/30 hover:border-themePrimary hover:bg-themeSoft hover:-translate-y-1 shadow-sm',
    danger: 'bg-red-500 text-white shadow-lg hover:bg-red-600 hover:-translate-y-1 hover:shadow-red-500/30',
    ghost: 'bg-transparent text-themeDeep hover:bg-themeSoft hover:-translate-y-1',
    outline: 'bg-transparent text-themePrimary border-2 border-themePrimary hover:bg-themePrimary hover:text-white hover:-translate-y-1',
    deep: 'bg-themeDeep text-white shadow-3d hover:-translate-y-1 hover:shadow-neon',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-2.5',
    xl: 'px-10 py-5 text-xl gap-3',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
    </motion.button>
  );
};

export default Button;
