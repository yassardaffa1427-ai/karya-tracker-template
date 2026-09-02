import { useSyncExternalStore } from 'react'
import { formatISO } from 'date-fns'
import type { AdminNotification, Submission } from '@/types'

const KEY = 'karya-tracker:admin-notifications:v1'
const listeners = new Set<() => void>()

let cache: AdminNotification[] | null = null

function read(): AdminNotification[] {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? '[]') as AdminNotification[]
  } catch {
    cache = []
  }
  return cache
}

function write(next: AdminNotification[]) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // abaikan: storage tidak tersedia
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * FR-10 sisi in-app. Pengiriman email reminder & alert admin adalah tugas
 * Cloud Functions (lihat functions/ di root); di klien kita hanya menyimpan
 * indikator in-app supaya admin melihat submission baru tanpa refresh.
 */
export function notifyAdmins(submission: Submission) {
  const notification: AdminNotification = {
    id: `notif-${submission.id}`,
    submissionId: submission.id,
    actorName: submission.name,
    message: `${submission.name} baru saja submit karya baru.`,
    createdAt: formatISO(new Date()),
    read: false,
  }
  write([notification, ...read()].slice(0, 50))
}

export function markAllNotificationsRead() {
  write(read().map((item) => ({ ...item, read: true })))
}

export function clearNotifications() {
  write([])
}

export function useAdminNotifications() {
  return useSyncExternalStore(subscribe, read, () => [] as AdminNotification[])
}
