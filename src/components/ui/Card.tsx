import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'bordered';
  children?: React.ReactNode;
  className?: string;
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-[#18181b] border border-slate-800 text-slate-100 transition-all',
        variant === 'default' && 'bg-[#18181b] border-slate-800 shadow-sm',
        variant === 'subtle' && 'bg-[#141416] border-slate-850',
        variant === 'bordered' && 'border-slate-700 bg-[#18181b]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-3.5 border-b border-slate-800 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { children?: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

