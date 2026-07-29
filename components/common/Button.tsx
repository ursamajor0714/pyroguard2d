// components/common/Button.tsx
import React, { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost' | 'glass' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className,
  ...props
}) => {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        {
          // Variants
          'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 focus:ring-blue-500': variant === 'primary',
          'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-500': variant === 'secondary',
          'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/25 focus:ring-red-500': variant === 'danger',
          'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 focus:ring-amber-500': variant === 'warning',
          'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 focus:ring-emerald-500': variant === 'success',
          'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200': variant === 'ghost',
          'bg-slate-900/60 backdrop-blur-md text-slate-200 border border-slate-700/50 hover:bg-slate-800/80 shadow-md focus:ring-blue-500': variant === 'glass',
          
          // Sizes
          'px-3 py-1.5 text-xs gap-1.5': size === 'sm',
          'px-4 py-2 text-sm gap-2': size === 'md',
          'px-5 py-2.5 text-base gap-2.5': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {icon && <span className="flex items-center justify-center">{icon}</span>}
      {children}
    </button>
  );
};
