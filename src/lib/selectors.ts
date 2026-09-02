import type { AppUser, LeaderboardEntry, RespondenRow, Submission } from '@/types'
import { isWithinRange } from './dates'

/**
 * FR-06: ranking by total karya all-time.
 * Tie-break sesuai PRD: yang lebih dulu mencapai total tersebut menang, yaitu
 * createdAt dari submission ke-N (N = total) milik masing-masing user.
 */
export function buildLeaderboard(submissions: Submission[], users: AppUser[]): LeaderboardEntry[] {
  const byUser = new Map<string, Submission[]>()
  for (const submission of submissions) {
    const list = byUser.get(submission.userId)
    if (list) list.push(submission)
    else byUser.set(submission.userId, [submission])
  }

  const rows = [...byUser.entries()]
    .map(([userId, list]) => {
      const ordered = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      const profile = users.find((user) => user.id === userId)
      const latest = ordered[ordered.length - 1]
      return {
        userId,
        name: profile?.name ?? latest.name,
        origin: latest.origin,
        photoUrl: profile?.photoUrl ?? null,
        total: ordered.length,
        reachedAt: latest.createdAt,
      }
    })
    .sort((a, b) => b.total - a.total || a.reachedAt.localeCompare(b.reachedAt))

  return rows.map((row, index) => ({ ...row, rank: index + 1 }))
}

/** FR-07: satu baris per responden, difilter berdasarkan tanggal submission. */
export function buildRespondenRows(
  submissions: Submission[],
  users: AppUser[],
  range: { start: string | null; end: string | null },
  search = '',
): RespondenRow[] {
  const filtered = submissions.filter((submission) =>
    isWithinRange(submission.createdAt, range.start, range.end),
  )

  const byUser = new Map<string, Submission[]>()
  for (const submission of filtered) {
    const list = byUser.get(submission.userId)
    if (list) list.push(submission)
    else byUser.set(submission.userId, [submission])
  }

  const keyword = search.trim().toLowerCase()

  return [...byUser.entries()]
    .map(([userId, list]) => {
      const ordered = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      const profile = users.find((user) => user.id === userId)
      return {
        userId,
        name: profile?.name ?? ordered[0].name,
        origin: ordered[0].origin,
        email: profile?.email ?? '—',
        photoUrl: profile?.photoUrl ?? null,
        total: ordered.length,
        lastSubmissionAt: ordered[0].createdAt,
      }
    })
    .filter((row) =>
      keyword
        ? row.name.toLowerCase().includes(keyword) || row.origin.toLowerCase().includes(keyword)
        : true,
    )
    .sort((a, b) => b.lastSubmissionAt.localeCompare(a.lastSubmissionAt))
}

export function countSubmissionsInRange(
  submissions: Submission[],
  range: { start: string | null; end: string | null },
) {
  return submissions.filter((submission) =>
    isWithinRange(submission.createdAt, range.start, range.end),
  ).length
}
