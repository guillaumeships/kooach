'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold transition-[background-color,border-color,color,box-shadow,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-kk-glow hover:bg-primary-hover',
        secondary:
          'bg-primary-subtle text-primary border border-primary-muted hover:bg-primary-muted/60',
        outline:
          'border border-border bg-card text-foreground shadow-kk-sm hover:border-primary-muted hover:text-primary',
        ghost:
          'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-[0_4px_14px_rgba(220,38,38,0.22)]',
        destructiveOutline:
          'border border-destructive/30 bg-card text-destructive hover:bg-destructive/5 hover:border-destructive/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4 gap-2',
        lg: 'h-12 px-5 text-[15px] gap-2',
        icon: 'h-10 w-10',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type MotionButtonProps = HTMLMotionProps<'button'>;

type IconComponent = React.ComponentType<{ className?: string }>;

export interface ButtonProps
  extends Omit<MotionButtonProps, 'children'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: IconComponent;
  rightIcon?: IconComponent;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      block,
      asChild = false,
      loading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const reduce = useReducedMotion();
    const isDisabled = disabled || loading;

    if (asChild) {
      return (
        <Slot
          ref={ref as unknown as React.Ref<HTMLElement>}
          className={cn(buttonVariants({ variant, size, block }), className)}
          {...(props as React.HTMLAttributes<HTMLElement>)}
        >
          {children}
        </Slot>
      );
    }

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileHover={!isDisabled && !reduce ? { y: -1 } : undefined}
        whileTap={!isDisabled && !reduce ? { scale: 0.97 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(buttonVariants({ variant, size, block }), className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : LeftIcon ? (
          <span className="inline-flex items-center [&_svg]:h-4 [&_svg]:w-4">
            <LeftIcon />
          </span>
        ) : null}
        {children}
        {!loading && RightIcon && (
          <span className="inline-flex items-center [&_svg]:h-4 [&_svg]:w-4">
            <RightIcon />
          </span>
        )}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
