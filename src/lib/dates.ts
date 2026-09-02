import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfWeek,
  subDays,
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { ActivityDay, Submission } from '@/types'

export const DAY_KEY = 'yyyy-MM-dd'

export function dayKey(value: string | Date) {
  const date = typeof value === 'string' ? parseISO(value) : value
  return format(date, DAY_KEY)
}

export function formatLongDate(value: string) {
  return format(parseISO(value), 'd MMMM yyyy', { locale: localeId })
}

export function formatDateTime(value: string) {
  return format(parseISO(value), "d MMM yyyy 'pukul' HH:mm", { locale: localeId })
}

export function formatShortDate(value: string) {
  return format(parseISO(value), 'd MMM yyyy', { locale: localeId })
}

/**
 * FR-04: kalender biner — sebuah tanggal aktif jika punya >= 1 submission.
 * Grid dimulai dari hari Minggu agar kolom mingguan rapi ala GitHub.
 */
export function buildActivityCalendar(
  submissions: Submission[],
  days = 364,
  today = new Date(),
): ActivityDay[] {
  const counts = new Map<string, number>()
  for (const submission of submissions) {
    const key = dayKey(submission.createdAt)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const start = startOfWeek(subDays(today, days), { weekStartsOn: 0 })
  const end = endOfWeek(today, { weekStartsOn: 0 })

  return eachDayOfInterval({ start, end }).map((date) => {
    const key = format(date, DAY_KEY)
    const submissionCount = counts.get(key) ?? 0
    return { date: key, isActive: submissionCount > 0, submissionCount }
  })
}

export function chunkIntoWeeks(days: ActivityDay[]): ActivityDay[][] {
  const weeks: ActivityDay[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

/** Label bulan untuk baris header heatmap: hanya di kolom minggu pertama tiap bulan. */
export function monthLabels(weeks: ActivityDay[][]) {
  return weeks.map((week, index) => {
    const first = parseISO(week[0].date)
    const previous = index > 0 ? parseISO(weeks[index - 1][0].date) : null
    if (previous && isSameMonth(first, previous)) return ''
    return format(first, 'LLL', { locale: localeId })
  })
}

/** Streak berjalan: jumlah hari aktif berturut-turut sampai hari ini (atau kemarin). */
export function currentStreak(days: ActivityDay[]): number {
  const map = new Map(days.map((day) => [day.date, day.isActive]))
  const today = new Date()
  let streak = 0
  let cursor = map.get(format(today, DAY_KEY)) ? today : subDays(today, 1)
  while (map.get(format(cursor, DAY_KEY))) {
    streak += 1
    cursor = subDays(cursor, 1)
  }
  return streak
}

export function longestStreak(days: ActivityDay[]): number {
  let best = 0
  let running = 0
  for (const day of days) {
    running = day.isActive ? running + 1 : 0
    if (running > best) best = running
  }
  return best
}

export function isWithinRange(value: string, start: string | null, end: string | null) {
  const key = dayKey(value)
  if (start && key < start) return false
  if (end && key > end) return false
  return true
}
