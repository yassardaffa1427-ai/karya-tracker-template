import { useMemo } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { Submission } from '@/types'
import {
  buildActivityCalendar,
  chunkIntoWeeks,
  currentStreak,
  formatLongDate,
  longestStreak,
  monthLabels,
} from '@/lib/dates'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/states'

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

interface ActivityCalendarProps {
  submissions: Submission[]
  loading?: boolean
  onDark?: boolean
  title?: string
  subtitle?: string
}

/**
 * FR-04 — heatmap biner ala GitHub: satu warna aktif per hari, tanpa gradasi.
 * Setiap sel punya tooltip + aria-label berisi tanggal & jumlah submission,
 * jadi informasinya tidak hanya bergantung pada warna (WCAG 2.2 AA).
 */
export function ActivityCalendar({
  submissions,
  loading,
  onDark,
  title = 'Kalender aktivitas',
  subtitle = '1 tahun terakhir',
}: ActivityCalendarProps) {
  const days = useMemo(() => buildActivityCalendar(submissions), [submissions])
  const weeks = useMemo(() => chunkIntoWeeks(days), [days])
  const labels = useMemo(() => monthLabels(weeks), [weeks])
  const streak = useMemo(() => currentStreak(days), [days])
  const best = useMemo(() => longestStreak(days), [days])
  const activeDays = days.filter((day) => day.isActive).length

  if (loading) {
    return (
      <section className={cn(onDark ? 'rounded-card bg-white/[0.04] p-5' : 'fin-card p-5')}>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-[124px] w-full" />
      </section>
    )
  }

  return (
    <Tooltip.Provider delayDuration={80}>
      <section className={cn(onDark ? 'rounded-card bg-white/[0.04] p-5' : 'fin-card p-5')}>
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={cn('text-[18px] font-semibold leading-6', onDark ? 'text-white' : 'text-ink')}>
              {title}
            </h2>
            <p className={cn('mt-0.5 text-[13px]', onDark ? 'text-slate-400' : 'text-ink-muted')}>
              {subtitle} · {activeDays} hari aktif
            </p>
          </div>
          <dl className="flex gap-2">
            <StreakPill label="Streak" value={`${streak} hari`} highlight onDark={onDark} />
            <StreakPill label="Terpanjang" value={`${best} hari`} onDark={onDark} />
          </dl>
        </header>

        <div className="fin-scroll mt-5 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-[3px]">
            <div className="mr-1 flex flex-col gap-[3px] pt-[18px]">
              {WEEKDAYS.map((weekday, index) => (
                <span
                  key={weekday}
                  className={cn(
                    'flex h-[13px] items-center text-[10px] leading-none',
                    onDark ? 'text-slate-500' : 'text-ink-faint',
                    index % 2 === 1 ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  {weekday}
                </span>
              ))}
            </div>

            {weeks.map((week, weekIndex) => (
              <div key={week[0].date} className="flex flex-col gap-[3px]">
                <span
                  className={cn(
                    'h-[15px] text-[10px] font-medium capitalize leading-none',
                    onDark ? 'text-slate-500' : 'text-ink-faint',
                  )}
                >
                  {labels[weekIndex]}
                </span>
                {week.map((day) => (
                  <Tooltip.Root key={day.date}>
                    <Tooltip.Trigger asChild>
                      <button
                        type="button"
                        aria-label={`${formatLongDate(day.date)} — ${day.submissionCount} karya`}
                        className={cn(
                          'h-[13px] w-[13px] rounded-[3px] transition-transform hover:scale-125',
                          day.isActive
                            ? 'bg-brand-600 ring-1 ring-inset ring-brand-700/40'
                            : onDark
                              ? 'bg-white/[0.07]'
                              : 'bg-slate-200/80',
                        )}
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        sideOffset={6}
                        className="z-50 rounded-lg bg-darkbg-main px-2.5 py-1.5 text-[12px] font-medium text-white shadow-dark-panel animate-fade-in"
                      >
                        <span className="block">{formatLongDate(day.date)}</span>
                        <span className="block text-slate-400">{day.submissionCount} karya</span>
                        <Tooltip.Arrow className="fill-darkbg-main" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                ))}
              </div>
            ))}
          </div>
        </div>

        <footer
          className={cn(
            'mt-3 flex items-center gap-2 text-[11px]',
            onDark ? 'text-slate-500' : 'text-ink-faint',
          )}
        >
          <span>Belum submit</span>
          <span className={cn('h-[11px] w-[11px] rounded-[3px]', onDark ? 'bg-white/[0.07]' : 'bg-slate-200/80')} />
          <span className="h-[11px] w-[11px] rounded-[3px] bg-brand-600" />
          <span>Sudah submit</span>
        </footer>
      </section>
    </Tooltip.Provider>
  )
}

function StreakPill({
  label,
  value,
  highlight,
  onDark,
}: {
  label: string
  value: string
  highlight?: boolean
  onDark?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-control px-3 py-1.5',
        highlight
          ? 'bg-brand-600 text-white'
          : onDark
            ? 'bg-white/10 text-slate-200'
            : 'bg-surface-overlay text-ink',
      )}
    >
      <dt className={cn('text-[10px] font-medium', highlight ? 'text-white/75' : 'opacity-70')}>
        {label}
      </dt>
      <dd className="text-[13px] font-bold leading-4">{value}</dd>
    </div>
  )
}
