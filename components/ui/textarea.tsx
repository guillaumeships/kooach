import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  filled?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, filled, value, ...props }, ref) => {
    const isFilled = filled ?? (typeof value === 'string' && value.trim().length > 0);
    return (
      <textarea
        ref={ref}
        value={value}
        className={cn(
          'flex min-h-[60px] w-full rounded-md border bg-card px-3 py-2 text-sm font-sans transition-[border-color,background-color,box-shadow] resize-none',
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
Textarea.displayName = 'Textarea';

export { Textarea };
