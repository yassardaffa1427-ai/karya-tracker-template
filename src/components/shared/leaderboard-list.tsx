import { Trophy } from 'lucide-react'
import type { LeaderboardEntry } from '@/types'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState, Skeleton } from '@/components/ui/states'

const MEDAL = ['bg-[#FDE68A] text-[#92400E]', 'bg-[#E2E8F0] text-[#475569]', 'bg-[#FED7AA] text-[#9A3412]']

interface LeaderboardListProps {
  entries: LeaderboardEntry[]
  loading?: boolean
  highlightUserId?: string
  limit?: number
  onDark?: boolean
}

export function LeaderboardList({
  entries,
  loading,
  highlightUserId,
  limit,
  onDark,
}: LeaderboardListProps) {
  if (loading) {
    return (
      <ul className="space-y-2">
        {Array.from({ length: limit ?? 5 }).map((_, index) => (
          <li key={index} className="flex items-center gap-3 rounded-card px-3 py-2.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-10" />
          </li>
        ))}
      </ul>
    )
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        onDark={onDark}
        title="Leaderboard masih kosong"
        description="Belum ada satu pun karya yang masuk. Ranking akan muncul setelah kontributor pertama submit."
      />
    )
  }

  const rows = limit ? entries.slice(0, limit) : entries

  return (
    <ol className="space-y-1.5">
      {rows.map((entry) => {
        const isSelf = entry.userId === highlightUserId
        return (
          <li
            key={entry.userId}
            className={cn(
              'flex items-center gap-3 rounded-card px-3 py-2.5 transition-colors',
              isSelf
                ? 'bg-brand-600 text-white'
                : onDark
                  ? 'hover:bg-white/[0.06]'
                  : 'hover:bg-surface-overlay',
            )}
          >
            <span
              className={cn(
                'grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold',
                isSelf
                  ? 'bg-white/20 text-white'
                  : entry.rank <= 3
                    ? MEDAL[entry.rank - 1]
                    : onDark
                      ? 'bg-white/10 text-slate-300'
                      : 'bg-surface-overlay text-ink-muted',
              )}
            >
              {entry.rank}
            </span>

            <Avatar name={entry.name} photoUrl={entry.photoUrl} size="sm" />

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'truncate text-[14px] font-semibold',
                  isSelf ? 'text-white' : onDark ? 'text-white' : 'text-ink',
                )}
              >
                {entry.name}
                {isSelf ? <span className="ml-1.5 text-[11px] font-medium opacity-80">(kamu)</span> : null}
              </p>
              <p
                className={cn(
                  'truncate text-[12px]',
                  isSelf ? 'text-white/75' : onDark ? 'text-slate-400' : 'text-ink-faint',
                )}
              >
                {entry.origin}
              </p>
            </div>

            <span
              className={cn(
                'shrink-0 text-[14px] font-bold tabular-nums',
                isSelf ? 'text-white' : onDark ? 'text-white' : 'text-ink',
              )}
            >
              {entry.total}
              <span
                className={cn(
                  'ml-1 text-[11px] font-medium',
                  isSelf ? 'text-white/70' : onDark ? 'text-slate-400' : 'text-ink-faint',
                )}
              >
                karya
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
