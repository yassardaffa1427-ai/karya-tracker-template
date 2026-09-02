type AnalyticsEvent =
  | 'submission_created'
  | 'submission_deleted'
  | 'admin_login'
  | 'admin_invite_sent'
  | 'leaderboard_viewed'

/**
 * Analytics plan PRD bagian 11. Belum ada provider yang dikonfigurasi di v1.0,
 * jadi event dicatat ke console agar tetap terlihat saat QA.
 */
export function track(event: AnalyticsEvent, payload: Record<string, unknown> = {}) {
  if (import.meta.env.DEV) {
    console.info('[analytics]', event, payload)
  }
}
