import { useEffect, useMemo } from 'react'
import { Award, Medal, Trophy, Users } from 'lucide-react'
import { track } from '@/lib/analytics'
import { useAuth } from '@/features/auth/auth-context'
import { useLeaderboard } from '@/features/submissions/queries'
import { AppShell, PageHeader } from '@/components/shared/app-shell'
import { LeaderboardList } from '@/components/shared/leaderboard-list'
import { StatCard } from '@/components/shared/stat-card'
import { Avatar } from '@/components/ui/avatar'
import { ErrorState } from '@/components/ui/states'
import { cn } from '@/lib/utils'

const PODIUM_STYLE = [
  'order-2 sm:order-2 bg-gradient-to-br from-brand-500 to-brand-700 text-white',
  'order-1 sm:order-1 fin-card',
  'order-3 sm:order-3 fin-card',
]

export function LeaderboardPage() {
  const { user } = useAuth()
  const leaderboardQuery = useLeaderboard()

  const entries = leaderboardQuery.data ?? []
  const totalKarya = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.total, 0),
    [entries],
  )

  useEffect(() => {
    track('leaderboard_viewed')
  }, [])

  const loading = leaderboardQuery.isLoading
  const podium = entries.slice(0, 3)
  const myRank = entries.find((entry) => entry.userId === user?.id)

  return (
    <AppShell>
      <PageHeader
        title="Leaderboard"
        subtitle="Ranking kontributor berdasarkan total karya yang terkumpul, sepanjang waktu."
      />

      {leaderboardQuery.isError ? (
        <ErrorState
          message={
            leaderboardQuery.error instanceof Error
              ? leaderboardQuery.error.message
              : 'Tidak diketahui'
          }
          onRetry={() => void leaderboardQuery.refetch()}
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total kontributor"
              value={String(entries.length)}
              icon={Users}
              loading={loading}
              footnote="Punya minimal 1 karya"
            />
            <StatCard
              label="Total karya"
              value={String(totalKarya)}
              icon={Award}
              loading={loading}
              footnote="Terkumpul di sistem"
            />
            <StatCard
              label="Posisi kamu"
              value={myRank ? `#${myRank.rank}` : '—'}
              icon={Medal}
              accent
              loading={loading}
              footnote={myRank ? `${myRank.total} karya` : 'Belum masuk ranking'}
            />
          </section>

          {podium.length > 0 ? (
            <section className="mt-6 grid gap-4 sm:grid-cols-3">
              {podium.map((entry, index) => (
                <article
                  key={entry.userId}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-card p-6 text-center',
                    PODIUM_STYLE[index],
                  )}
                >
                  <span
                    className={cn(
                      'grid h-8 w-8 place-items-center rounded-full text-[13px] font-bold',
                      index === 0 ? 'bg-white/20 text-white' : 'bg-surface-overlay text-ink-muted',
                    )}
                  >
                    {entry.rank}
                  </span>
                  <Avatar name={entry.name} photoUrl={entry.photoUrl} size="lg" />
                  <div>
                    <p
                      className={cn(
                        'text-[15px] font-semibold',
                        index === 0 ? 'text-white' : 'text-ink',
                      )}
                    >
                      {entry.name}
                    </p>
                    <p
                      className={cn(
                        'text-[12px]',
                        index === 0 ? 'text-white/75' : 'text-ink-faint',
                      )}
                    >
                      {entry.origin}
                    </p>
                  </div>
                  <p
                    className={cn(
                      'text-[24px] font-bold leading-8',
                      index === 0 ? 'text-white' : 'text-ink',
                    )}
                  >
                    {entry.total}
                  </p>
                  <p
                    className={cn(
                      'text-[11px] font-semibold uppercase tracking-wide',
                      index === 0 ? 'text-white/70' : 'text-ink-faint',
                    )}
                  >
                    karya
                  </p>
                </article>
              ))}
            </section>
          ) : null}

          <section className="mt-4 fin-card p-5">
            <header className="mb-4 flex items-center gap-2">
              <Trophy className="h-[18px] w-[18px] text-brand-600" aria-hidden />
              <h2 className="text-[18px] font-semibold leading-6 text-ink">Peringkat lengkap</h2>
            </header>
            <LeaderboardList entries={entries} loading={loading} highlightUserId={user?.id} />
          </section>
        </>
      )}
    </AppShell>
  )
}
