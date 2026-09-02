import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowUpRight,
  CalendarCheck2,
  Flame,
  History,
  Layers,
  Plus,
  Trophy,
} from 'lucide-react'
import type { Submission } from '@/types'
import { AppError } from '@/lib/data'
import { buildActivityCalendar, currentStreak, formatShortDate } from '@/lib/dates'
import { useAuth } from '@/features/auth/auth-context'
import {
  useDeleteSubmission,
  useLeaderboard,
  useMySubmissions,
} from '@/features/submissions/queries'
import { SubmissionFormModal } from '@/features/submissions/submission-form-modal'
import { AppShell, PageHeader } from '@/components/shared/app-shell'
import { ActivityCalendar } from '@/components/shared/activity-calendar'
import { LeaderboardList } from '@/components/shared/leaderboard-list'
import { StatCard } from '@/components/shared/stat-card'
import { SubmissionCard } from '@/components/shared/submission-card'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'

const PAGE_SIZE = 6

export function UserDashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const mine = useMySubmissions(user?.id)
  const leaderboardQuery = useLeaderboard()
  const deleteMutation = useDeleteSubmission(user)

  const [formOpen, setFormOpen] = useState(location.pathname === '/submit')
  const [editing, setEditing] = useState<Submission | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Submission | null>(null)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const submissions = mine.data ?? []

  const days = useMemo(() => buildActivityCalendar(submissions), [submissions])
  const streak = useMemo(() => currentStreak(days), [days])
  const leaderboard = leaderboardQuery.data ?? []
  const myRank = leaderboard.find((entry) => entry.userId === user?.id)

  const lastSubmission = submissions[0]
  const lastDefaults = lastSubmission
    ? {
        name: lastSubmission.name,
        origin: lastSubmission.origin,
        socialAccountUrl: lastSubmission.socialAccountUrl,
      }
    : undefined

  // Rute /submit dan / merender komponen yang sama, jadi React tidak me-remount
  // saat berpindah — modal dibuka dari pathname, bukan dari state awal.
  useEffect(() => {
    if (location.pathname === '/submit') {
      setEditing(null)
      setFormOpen(true)
    }
  }, [location.pathname])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open)
    if (open) return
    setEditing(null)
    if (location.pathname === '/submit') navigate('/', { replace: true })
  }

  function openEdit(submission: Submission) {
    setEditing(submission)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete)
      toast.success('Karya dihapus.')
      setPendingDelete(null)
    } catch (error) {
      toast.error(error instanceof AppError ? error.message : 'Gagal menghapus karya.')
      setPendingDelete(null)
    }
  }

  return (
    <AppShell>
      <PageHeader
        title={`Halo, ${user?.name.split(' ')[0] ?? 'Kontributor'} 👋`}
        subtitle="Pantau konsistensi berkaryamu dan submit karya baru hari ini."
        actions={
          <Button variant="gradient" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            Submit karya
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total karya"
          value={String(submissions.length)}
          icon={Layers}
          loading={mine.isLoading}
          footnote="Sepanjang waktu"
        />
        <StatCard
          label="Streak berjalan"
          value={`${streak} hari`}
          icon={Flame}
          accent
          loading={mine.isLoading}
          trend={
            streak > 0
              ? { text: 'Aktif', tone: 'up' }
              : { text: 'Terputus', tone: 'flat' }
          }
          footnote={streak > 0 ? 'Pertahankan!' : 'Submit hari ini untuk mulai lagi'}
        />
        <StatCard
          label="Submission terakhir"
          value={lastSubmission ? formatShortDate(lastSubmission.createdAt) : '—'}
          icon={CalendarCheck2}
          loading={mine.isLoading}
          footnote={lastSubmission ? 'Karya terbaru kamu' : 'Belum ada karya'}
        />
        <StatCard
          label="Peringkat kamu"
          value={myRank ? `#${myRank.rank}` : '—'}
          icon={Trophy}
          loading={leaderboardQuery.isLoading}
          footnote={
            myRank ? `dari ${leaderboard.length} kontributor` : 'Submit karya untuk masuk ranking'
          }
        />
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {mine.isError ? (
            <ErrorState
              message={mine.error instanceof Error ? mine.error.message : 'Tidak diketahui'}
              onRetry={() => void mine.refetch()}
            />
          ) : (
            <ActivityCalendar submissions={submissions} loading={mine.isLoading} />
          )}

          <section className="fin-card p-5">
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-semibold leading-6 text-ink">Histori karya</h2>
                <p className="mt-0.5 text-[13px] text-ink-muted">
                  Terbaru lebih dulu · {submissions.length} karya
                </p>
              </div>
            </header>

            {mine.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-[92px] w-full rounded-card" />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <EmptyState
                icon={History}
                title="Belum ada karya"
                description="Kamu belum pernah submit karya. Mulai dari yang pertama, sisanya akan menyusul."
                action={
                  <Button variant="gradient" onClick={openCreate}>
                    <Plus className="h-4 w-4" aria-hidden />
                    Submit karya pertamamu
                  </Button>
                }
              />
            ) : (
              <>
                <div className="space-y-3">
                  {submissions.slice(0, visible).map((submission) => (
                    <SubmissionCard
                      key={submission.id}
                      submission={submission}
                      onEdit={openEdit}
                      onDelete={setPendingDelete}
                    />
                  ))}
                </div>

                {visible < submissions.length ? (
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="secondary"
                      onClick={() => setVisible((count) => count + PAGE_SIZE)}
                    >
                      Muat lebih banyak ({submissions.length - visible} lagi)
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="fin-card p-5">
            <header className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-semibold leading-6 text-ink">Leaderboard</h2>
                <p className="mt-0.5 text-[13px] text-ink-muted">Top kontributor all-time</p>
              </div>
              <Link
                to="/leaderboard"
                className="flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-800"
              >
                Lihat semua
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </header>

            <LeaderboardList
              entries={leaderboard}
              loading={leaderboardQuery.isLoading}
              highlightUserId={user?.id}
              limit={5}
            />
          </section>

          <section className="dark-scope fin-container p-5">
            <h2 className="text-[16px] font-semibold text-white">Tips konsistensi</h2>
            <p className="mt-1.5 text-[13px] leading-5 text-slate-400">
              Satu karya per hari sudah cukup untuk menyalakan kotak di kalender. Kalender hanya
              menandai aktif/tidak — bukan seberapa banyak.
            </p>
            <Button variant="onDark" className="mt-4 w-full" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              Submit sekarang
            </Button>
          </section>
        </aside>
      </div>

      <SubmissionFormModal
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        submission={editing}
        defaults={lastDefaults}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Hapus karya ini?"
        description="Karya akan dihapus permanen. Kalau ini satu-satunya karya di tanggal tersebut, kotak kalender hari itu ikut padam."
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </AppShell>
  )
}
