import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary-dark',
        ready: 'border-transparent bg-accent/15 text-green-700',
        cleaning: 'border-transparent bg-warning/15 text-amber-700',
        blocked: 'border-transparent bg-danger/15 text-red-700',
        unknown: 'border-transparent bg-slate-200 text-text-muted',
        secondary: 'border-transparent bg-slate-100 text-text-muted',
        destructive: 'border-transparent bg-danger/15 text-danger',
        outline: 'text-text',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
