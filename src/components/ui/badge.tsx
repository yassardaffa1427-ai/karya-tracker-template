import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-[14px]',
  {
    variants: {
      tone: {
        neutral: 'bg-[#F1F5F9] text-[#64748B]',
        brand: 'bg-brand-100 text-brand-700',
        success: 'bg-[#DCFCE7] text-[#15803D]',
        danger: 'bg-[#FEE2E2] text-[#B91C1C]',
        info: 'bg-[#E0F2FE] text-[#0369A1]',
        onDark: 'bg-white/15 text-slate-200',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
