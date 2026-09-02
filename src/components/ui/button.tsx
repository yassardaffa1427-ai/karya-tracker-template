import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-55',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white shadow-[0_6px_16px_-6px_rgba(83,70,224,0.7)] hover:bg-brand-800 active:scale-[0.98]',
        gradient:
          'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_8px_20px_-8px_rgba(67,43,179,0.8)] hover:brightness-110 active:scale-[0.98]',
        secondary: 'border border-line bg-white text-ink hover:bg-surface-overlay',
        ghost: 'text-ink-muted hover:bg-surface-overlay hover:text-ink',
        onDark: 'bg-white text-darkbg-main hover:bg-slate-100 active:scale-[0.98]',
        ghostDark: 'text-slate-300 hover:bg-white/10 hover:text-white',
        danger: 'bg-[#EF4444] text-white hover:bg-[#B91C1C] active:scale-[0.98]',
        dangerSoft: 'bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA]',
      },
      size: {
        sm: 'h-8 rounded-full px-3 text-[12px]',
        md: 'h-10 rounded-full px-5 text-[14px]',
        lg: 'h-11 rounded-full px-6 text-[14px]',
        icon: 'h-9 w-9 rounded-full',
        block: 'h-11 w-full rounded-control text-[14px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
