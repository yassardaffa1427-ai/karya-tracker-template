import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, startOfMonth, subDays } from 'date-fns'
import {
  CalendarRange,
  ChevronRight,
  FileStack,
  Filter,
  Search,
  Users,
  X,
} from 'lucide-react'
import type { DateRange } from '@/types'
import { DAY_KEY, formatShortDate } from '@/lib/dates'
import { buildRespondenRows, countSubmissionsInRange } from '@/lib/selectors'
import { useAllSubmissions, useUsers } from '@/features/submissions/queries'
import { AppShell, PageHeader } from '@/components/shared/app-shell'
import { StatCard } from '@/components/shared/stat-card'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/states'
import { cn } from '@/lib/utils'

const PRESETS = [
  { label: 'Semua', getRange: (): DateRange => ({ start: null, end: null }) },
  {
    label: '7 hari',
    getRange: (): DateRange => ({
      start: format(subDays(new Date(), 6), DAY_KEY),
      end: format(new Date(), DAY_KEY),
    }),
  },
  {
    label: '30 hari',
    getRange: (): DateRange => ({
      start: format(subDays(new Date(), 29), DAY_KEY),
      end: format(new Date(), DAY_KEY),
    }),
  },
  {
    label: 'Bulan ini',
    getRange: (): DateRange => ({
      start: format(startOfMonth(new Date()), DAY_KEY),
      end: format(new Date(), DAY_KEY),
    }),
  },
]

export function AdminRespondenPage() {
  const navigate = useNavigate()
  const all = useAllSubmissions()
  const users = useUsers()

  const [range, setRange] = useState<DateRange>({ start: null, end: null })
  const [search, setSearch] = useState('')
  const [activePreset, setActivePreset] = useState('Semua')

  const rows = useMemo(
    () => buildRespondenRows(all.data ?? [], users.data ?? [], range, search),
    [all.data, users.data, range, search],
  )

  const submissionsInRange = useMemo(
    () => countSubmissionsInRange(all.data ?? [], range),
    [all.data, range],
  )

  const loading = all.isLoading || users.isLoading
  const adminCount = (users.data ?? []).filter((user) => user.role === 'admin').length
  const hasFilter = Boolean(range.start || range.end || search)

  function applyPreset(label: string, next: DateRange) {
    setActivePreset(label)
    setRange(next)
  }

  function resetFilters() {
    setActivePreset('Semua')
    setRange({ start: null, end: null })
    setSearch('')
  }

  return (
    <AppShell>
      <PageHeader
        title="Responden"
        subtitle="Pantau siapa saja yang mengumpulkan karya dan kapan terakhir mereka aktif."
        actions={
          hasFilter ? (
            <Button variant="secondary" onClick={resetFilters}>
              <X className="h-4 w-4" aria-hidden />
              Reset filter
            </Button>
          ) : null
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Responden aktif"
          value={String(rows.length)}
          icon={Users}
          loading={loading}
          footnote={hasFilter ? 'Sesuai filter' : 'Sepanjang waktu'}
        />
        <StatCard
          label="Karya pada rentang"
          value={String(submissionsInRange)}
          icon={FileStack}
          accent
          loading={loading}
          footnote={hasFilter ? 'Sesuai filter tanggal' : 'Total keseluruhan'}
        />
        <StatCard
          label="Total kontributor"
          value={String((users.data ?? []).filter((user) => user.role === 'user').length)}
          icon={Users}
          loading={loading}
          footnote="Terdaftar di sistem"
        />
        <StatCard
          label="Admin aktif"
          value={String(adminCount)}
          icon={Filter}
          loading={loading}
          footnote="Akses penuh (flat role)"
        />
      </section>

      <section className="mt-6 rounded-container border border-line bg-white p-4 shadow-card-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau asal…"
              aria-label="Cari responden"
              className="pl-9"
            />
          </div>

          <div className="flex items-end gap-2">
            <label className="space-y-1.5">
              <span className="block text-[12px] font-semibold text-ink-muted">Dari tanggal</span>
              <Input
                type="date"
                value={range.start ?? ''}
                max={range.end ?? undefined}
                onChange={(event) => {
                  setActivePreset('Kustom')
                  setRange((prev) => ({ ...prev, start: event.target.value || null }))
                }}
                className="w-[150px]"
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-[12px] font-semibold text-ink-muted">Sampai</span>
              <Input
                type="date"
                value={range.end ?? ''}
                min={range.start ?? undefined}
                onChange={(event) => {
                  setActivePreset('Kustom')
                  setRange((prev) => ({ ...prev, end: event.target.value || null }))
                }}
                className="w-[150px]"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.label, preset.getRange())}
                className={cn(
                  'rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors',
                  activePreset === preset.label
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-overlay text-ink-muted hover:bg-slate-200',
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {range.start || range.end ? (
          <p className="mt-3 flex items-center gap-1.5 text-[12px] text-ink-muted">
            <CalendarRange className="h-3.5 w-3.5" aria-hidden />
            Menampilkan submission {range.start ? formatShortDate(range.start) : 'awal'} –{' '}
            {range.end ? formatShortDate(range.end) : 'sekarang'}
          </p>
        ) : null}
      </section>

      <section className="mt-4">
        {all.isError ? (
          <ErrorState
            message={all.error instanceof Error ? all.error.message : 'Tidak diketahui'}
            onRetry={() => void all.refetch()}
          />
        ) : loading ? (
          <div className="fin-card space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-card" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="fin-card p-5">
            <EmptyState
              icon={CalendarRange}
              title="Tidak ada submission pada rentang ini"
              description="Coba longgarkan rentang tanggal atau hapus kata kunci pencarian."
              action={
                hasFilter ? (
                  <Button variant="secondary" onClick={resetFilters}>
                    Reset filter
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="fin-card overflow-hidden">
            <div className="fin-scroll hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-surface/70">
                    <Th>Nama</Th>
                    <Th>Asal</Th>
                    <Th className="text-right">Total karya</Th>
                    <Th>Submission terakhir</Th>
                    <Th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.userId}
                      tabIndex={0}
                      role="link"
                      onClick={() => navigate(`/admin/responden/${row.userId}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          navigate(`/admin/responden/${row.userId}`)
                        }
                      }}
                      className="cursor-pointer border-b border-line last:border-0 transition-colors hover:bg-surface-overlay"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={row.name} photoUrl={row.photoUrl} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-[14px] font-semibold text-ink">{row.name}</p>
                            <p className="truncate text-[12px] text-ink-faint">{row.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-ink-muted">{row.origin}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Badge tone="brand">{row.total} karya</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-ink-muted">
                        {formatShortDate(row.lastSubmissionAt)}
                      </td>
                      <td className="px-5 py-3.5 text-ink-faint">
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-line md:hidden">
              {rows.map((row) => (
                <li key={row.userId}>
                  <button
                    type="button"
                    onClick={() => navigate(`/admin/responden/${row.userId}`)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-overlay"
                  >
                    <Avatar name={row.name} photoUrl={row.photoUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-semibold text-ink">{row.name}</p>
                      <p className="truncate text-[12px] text-ink-muted">{row.origin}</p>
                      <p className="mt-1 text-[11px] text-ink-faint">
                        Terakhir {formatShortDate(row.lastSubmissionAt)}
                      </p>
                    </div>
                    <Badge tone="brand">{row.total}</Badge>
                    <ChevronRight className="h-4 w-4 text-ink-faint" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </AppShell>
  )
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'px-5 py-3 text-[12px] font-semibold uppercase tracking-wide text-ink-faint',
        className,
      )}
    >
      {children}
    </th>
  )
}
