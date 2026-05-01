import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  filled?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, filled, value, ...props }, ref) => {
    const isFilled = filled ?? (typeof value === 'string' && value.trim().length > 0);
    return (
      <input
        type={type}
        ref={ref}
        value={value}
        className={cn(
          'flex h-10 w-full rounded-md border bg-card px-3 py-2 text-sm font-sans transition-[border-color,background-color,box-shadow]',
          'placeholder:text-muted-foreground/70',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isFilled
            ? 'border-primary bg-primary-subtle/40'
            : 'border-input',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
