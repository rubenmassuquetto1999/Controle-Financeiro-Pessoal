import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'blue';
  children?: React.ReactNode;
  className?: string;
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold tracking-wider border uppercase font-mono whitespace-nowrap',
        variant === 'default' && 'bg-slate-800/80 text-slate-300 border-slate-700',
        variant === 'success' && 'bg-green-950/40 text-green-400 border-green-800/40',
        variant === 'danger' && 'bg-red-950/40 text-red-400 border-red-800/40',
        variant === 'warning' && 'bg-amber-950/40 text-amber-400 border-amber-800/40',
        (variant === 'info' || variant === 'blue') && 'bg-blue-950/40 text-blue-400 border-blue-800/40',
        variant === 'outline' && 'bg-transparent text-slate-400 border-slate-700',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

