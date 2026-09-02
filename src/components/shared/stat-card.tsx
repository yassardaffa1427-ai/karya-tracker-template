import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/states'

export interface StatCardProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  trend?: { text: string; tone: 'up' | 'down' | 'flat' }
  footnote?: string
  accent?: boolean
  loading?: boolean
}

const TREND_TONE = {
  up: 'bg-[#DCFCE7] text-[#15803D]',
  down: 'bg-[#FEE2E2] text-[#B91C1C]',
  flat: 'bg-[#F1F5F9] text-[#64748B]',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  footnote,
  accent,
  loading,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="fin-card flex min-h-[140px] flex-col justify-between p-5">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-36" />
      </div>
    )
  }

  return (
    <article
      className={cn(
        'flex min-h-[140px] flex-col justify-between rounded-card p-5 transition-shadow',
        accent
          ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_12px_28px_-12px_rgba(67,43,179,0.75)]'
          : 'fin-card hover:shadow-card-md',
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <p
          className={cn(
            'text-[13px] font-medium leading-5',
            accent ? 'text-white/80' : 'text-ink-muted',
          )}
        >
          {label}
        </p>
        <span
          className={cn(
            'grid h-9 w-9 place-items-center rounded-full',
            accent ? 'bg-white/15 text-white' : 'bg-surface-overlay text-brand-600',
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </header>

      <p
        className={cn(
          'mt-3 text-[24px] font-bold leading-8 tracking-tight',
          accent ? 'text-white' : 'text-ink',
        )}
      >
        {value}
      </p>

      <footer className="mt-3 flex flex-wrap items-center gap-2">
        {trend ? (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[11px] font-semibold',
              accent ? 'bg-white/20 text-white' : TREND_TONE[trend.tone],
            )}
          >
            {trend.text}
          </span>
        ) : null}
        {footnote ? (
          <span className={cn('text-[12px]', accent ? 'text-white/75' : 'text-ink-faint')}>
            {footnote}
          </span>
        ) : null}
      </footer>
    </article>
  )
}
