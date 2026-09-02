import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-control', className)} aria-hidden />
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onDark,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
  onDark?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card px-6 py-12 text-center',
        onDark ? 'border border-white/10 bg-white/[0.03]' : 'border border-dashed border-line bg-surface/60',
      )}
    >
      <div
        className={cn(
          'grid h-12 w-12 place-items-center rounded-full',
          onDark ? 'bg-white/10 text-slate-300' : 'bg-brand-100 text-brand-600',
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className={cn('text-[14px] font-semibold', onDark ? 'text-white' : 'text-ink')}>{title}</p>
        <p className={cn('max-w-sm text-[13px]', onDark ? 'text-slate-400' : 'text-ink-muted')}>
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-[#FECACA] bg-[#FEF2F2] px-6 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[#FEE2E2] text-[#B91C1C]">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="text-[14px] font-semibold text-[#B91C1C]">Gagal memuat data</p>
      <p className="max-w-sm text-[13px] text-[#B91C1C]/80">{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
        Coba lagi
      </Button>
    </div>
  )
}
