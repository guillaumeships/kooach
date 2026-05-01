import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary-subtle text-primary border border-primary-muted',
        secondary: 'bg-muted text-muted-foreground border border-border',
        success: 'bg-success-subtle text-success border border-primary-muted',
        warning: 'bg-warning-subtle text-warning-foreground border border-warning/30',
        outline: 'border border-border text-foreground',
        purple: 'bg-violet-100 text-violet-800 border border-violet-200',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
