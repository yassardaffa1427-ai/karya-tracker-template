import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  CalendarCheck2,
  ExternalLink,
  Flame,
  History,
  Layers,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import type { Submission } from '@/types'
import { AppError, getAdapter } from '@/lib/data'
import { buildActivityCalendar, currentStreak, formatDateTime, formatShortDate } from '@/lib/dates'
import { cn, hostnameOf } from '@/lib/utils'
import { useAuth } from '@/features/auth/auth-context'
import { useDeleteSubmission, useUsers } from '@/features/submissions/queries'
import { AppShell } from '@/components/shared/app-shell'
import { ActivityCalendar } from '@/components/shared/activity-calendar'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'

export function AdminDetailPage() {
  const { userId = '' } = useParams()
  const navigate = useNavigate()
  const { user: admin } = useAuth()
  const users = useUsers()
  const deleteMutation = useDeleteSubmission(admin)

  const submissionsQuery = useQuery({
    queryKey: ['submissions', 'mine', userId],
    queryFn: () => getAdapter().listSubmissionsByUser(userId),
    enabled: Boolean(userId),
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Submission | null>(null)

  const submissions = submissionsQuery.data ?? []
  const profile = (users.data ?? []).find((item) => item.id === userId)
  const selected = submissions.find((item) => item.id === selectedId) ?? submissions[0] ?? null

  const days = useMemo(() => buildActivityCalendar(submissions), [submissions])
  const streak = useMemo(() => currentStreak(days), [days])
  const loading = submissionsQuery.isLoading || users.isLoading

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteMutation.mutateAsync(pendingDelete)
      toast.success('Submission dihapus dari sistem.')
      if (selectedId === pendingDelete.id) setSelectedId(null)
      setPendingDelete(null)
    } catch (error) {
      toast.error(error instanceof AppError ? error.message : 'Gagal menghapus submission.')
      setPendingDelete(null)
    }
  }

  return (
    <AppShell>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" aria-label="Kembali" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Button>
          <div>
            <nav aria-label="Breadcrumb" className="text-[12px] text-ink-faint">
              <Link to="/admin" className="hover:text-brand-600">
                Responden
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-ink-muted">Detail</span>
            </nav>
            <h1 className="text-[28px] font-bold leading-9 tracking-tight text-ink">
              {loading ? 'Memuat…' : (profile?.name ?? submissions[0]?.name ?? 'Responden')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-[12px] text-ink-muted shadow-card-sm">
          <ShieldAlert className="h-4 w-4 text-brand-600" aria-hidden />
          Admin hanya bisa melihat dan menghapus — bukan mengedit.
        </div>
      </div>

      {submissionsQuery.isError ? (
        <ErrorState
          message={
            submissionsQuery.error instanceof Error ? submissionsQuery.error.message : 'Tidak diketahui'
          }
          onRetry={() => void submissionsQuery.refetch()}
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <ProfileCard
              loading={loading}
              name={profile?.name ?? submissions[0]?.name ?? '—'}
              email={profile?.email ?? '—'}
              origin={submissions[0]?.origin ?? '—'}
              photoUrl={profile?.photoUrl ?? null}
              role={profile?.role ?? 'user'}
              social={submissions[0]?.socialAccountUrl}
            />
            <MiniStat
              label="Total karya"
              value={String(submissions.length)}
              icon={Layers}
              loading={loading}
            />
            <MiniStat
              label="Streak berjalan"
              value={`${streak} hari`}
              icon={Flame}
              loading={loading}
              hint={
                submissions[0]
                  ? `Terakhir ${formatShortDate(submissions[0].createdAt)}`
                  : 'Belum ada karya'
              }
            />
          </section>

          <div className="mt-4">
            <ActivityCalendar
              submissions={submissions}
              loading={loading}
              title="Kalender aktivitas responden"
              subtitle="1 tahun terakhir"
            />
          </div>

          {/* Split workspace: master list gelap + inspector detail. */}
          <section className="dark-scope mt-4 grid gap-4 rounded-container bg-darkbg-main p-4 shadow-dark-panel lg:grid-cols-[minmax(0,1fr)_380px] lg:p-5">
            <div className="min-w-0">
              <header className="mb-4 flex items-center justify-between gap-3 px-1">
                <div>
                  <h2 className="text-[18px] font-semibold leading-6 text-white">Histori submission</h2>
                  <p className="mt-0.5 text-[13px] text-slate-400">
                    {submissions.length} karya · terbaru lebih dulu
                  </p>
                </div>
              </header>

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 w-full rounded-card bg-white/10" />
                  ))}
                </div>
              ) : submissions.length === 0 ? (
                <EmptyState
                  onDark
                  icon={History}
                  title="Tidak ada submission"
                  description="Seluruh karya responden ini sudah dihapus atau memang belum pernah ada."
                />
              ) : (
                <ul className="fin-scroll max-h-[520px] space-y-2 overflow-y-auto pr-1">
                  {submissions.map((submission) => {
                    const isActive = selected?.id === submission.id
                    return (
                      <li key={submission.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(submission.id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-card px-3.5 py-3 text-left transition-colors',
                            isActive
                              ? 'bg-brand-600 text-white'
                              : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]',
                          )}
                        >
                          <span
                            className={cn(
                              'grid h-9 w-9 shrink-0 place-items-center rounded-control text-[11px] font-bold',
                              isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300',
                            )}
                          >
                            {formatShortDate(submission.createdAt).split(' ')[0]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={cn('text-[14px] font-semibold', isActive ? 'text-white' : 'text-white')}>
                              {formatShortDate(submission.createdAt)}
                            </p>
                            <p
                              className={cn(
                                'truncate font-mono text-[11px]',
                                isActive ? 'text-white/75' : 'text-slate-400',
                              )}
                            >
                              {submission.linkUrl}
                            </p>
                          </div>
                          <Badge tone={isActive ? 'onDark' : 'onDark'}>
                            {hostnameOf(submission.linkUrl)}
                          </Badge>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <aside className="rounded-card bg-darkbg-panel p-5 shadow-dark-panel">
              {selected ? (
                <div className="flex h-full flex-col">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
                    Detail karya
                  </p>
                  <h3 className="mt-1 text-[18px] font-semibold leading-6 text-white">
                    {formatShortDate(selected.createdAt)}
                  </h3>
                  <p className="mt-0.5 text-[12px] text-white/60">
                    {formatDateTime(selected.createdAt)}
                  </p>

                  <dl className="mt-5 space-y-3.5">
                    <DetailRow label="Nama" value={selected.name} />
                    <DetailRow label="Asal" value={selected.origin} />
                    <DetailRow label="Akun sosmed" value={selected.socialAccountUrl} mono link />
                    <DetailRow label="Link karya" value={selected.linkUrl} mono link />
                  </dl>

                  <div className="mt-auto space-y-2 pt-6">
                    <Button
                      variant="onDark"
                      className="w-full"
                      onClick={() => window.open(selected.linkUrl, '_blank', 'noopener,noreferrer')}
                    >
                      See the Link
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full"
                      onClick={() => setPendingDelete(selected)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                      Hapus submission
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid h-full min-h-[260px] place-items-center text-center">
                  <div className="space-y-2">
                    <CalendarCheck2 className="mx-auto h-6 w-6 text-white/50" aria-hidden />
                    <p className="text-[13px] text-white/70">
                      Pilih satu karya di sebelah kiri untuk melihat detailnya.
                    </p>
                  </div>
                </div>
              )}
            </aside>
          </section>
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Hapus submission ini?"
        description="Karya akan hilang dari histori responden dan dari kalender aktivitas mereka. Tindakan ini permanen."
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </AppShell>
  )
}

function DetailRow({
  label,
  value,
  mono,
  link,
}: {
  label: string
  value: string
  mono?: boolean
  link?: boolean
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-white/50">{label}</dt>
      <dd className={cn('mt-0.5 break-words text-[13px] text-white', mono && 'font-mono text-[12px]')}>
        {link ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white/30 underline-offset-2 hover:decoration-white"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

function ProfileCard({
  loading,
  name,
  email,
  origin,
  photoUrl,
  role,
  social,
}: {
  loading?: boolean
  name: string
  email: string
  origin: string
  photoUrl: string | null
  role: 'user' | 'admin'
  social?: string
}) {
  if (loading) {
    return (
      <div className="fin-card space-y-3 p-5">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    )
  }

  return (
    <article className="fin-card flex items-start gap-3 p-5">
      <Avatar name={name} photoUrl={photoUrl} size="lg" />
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[15px] font-semibold text-ink">{name}</p>
          <Badge tone={role === 'admin' ? 'brand' : 'neutral'}>
            {role === 'admin' ? 'Admin' : 'Kontributor'}
          </Badge>
        </div>
        <p className="truncate text-[13px] text-ink-muted">{origin}</p>
        <p className="truncate text-[12px] text-ink-faint">{email}</p>
        {social ? (
          <a
            href={social}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-600 hover:text-brand-800"
          >
            {hostnameOf(social)}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : null}
      </div>
    </article>
  )
}

function MiniStat({
  label,
  value,
  icon: Icon,
  hint,
  loading,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  hint?: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="fin-card space-y-3 p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-20" />
      </div>
    )
  }

  return (
    <article className="fin-card flex flex-col justify-between p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-muted">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-overlay text-brand-600">
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-[24px] font-bold leading-8 text-ink">{value}</p>
      {hint ? <p className="mt-1 text-[12px] text-ink-faint">{hint}</p> : null}
    </article>
  )
}
