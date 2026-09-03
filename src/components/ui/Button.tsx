import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-bold rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
          size === 'sm' && 'h-8 px-3 py-1 text-xs',
          size === 'md' && 'h-9 px-4 py-2 text-xs',
          size === 'lg' && 'h-11 px-5 py-3 text-xs font-bold tracking-wider uppercase',
          (variant === 'primary' || variant === 'blue') && 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs',
          variant === 'secondary' && 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
          variant === 'outline' && 'border border-slate-700 bg-transparent hover:bg-slate-800/80 text-slate-300',
          variant === 'danger' && 'bg-red-600 hover:bg-red-500 text-white font-bold',
          variant === 'ghost' && 'hover:bg-slate-800 text-slate-400 hover:text-slate-200',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-3.5 w-3.5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

