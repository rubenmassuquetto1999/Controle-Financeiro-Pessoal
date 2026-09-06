import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, hint, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'flex h-9 w-full rounded-lg border border-slate-700 bg-[#09090b] px-3 py-2 text-base md:text-xs text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            error && 'border-red-500/80 focus:border-red-500 focus:ring-red-500/30',
            className
          )}
          {...props}
        />
        {error && <p className="text-[10px] text-red-400 font-medium">{error}</p>}
        {hint && !error && <p className="text-[10px] text-slate-500 font-mono">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

