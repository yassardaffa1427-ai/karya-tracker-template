import { onSchedule } from 'firebase-functions/v2/scheduler'
import * as logger from 'firebase-functions/logger'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { layout, sendEmail } from '../lib/email'

const HOUR = Number(process.env.FUNCTIONS_REMINDER_CRON_HOUR ?? 19)
const TIMEZONE = process.env.FUNCTIONS_TIMEZONE ?? 'Asia/Jakarta'

/**
 * FR-10: reminder harian, hanya ke user yang belum submit pada hari berjalan.
 * Batas hari mengikuti timestamp server, bukan zona waktu klien.
 */
export const dailyReminder = onSchedule(
  { schedule: `0 ${HOUR} * * *`, timeZone: TIMEZONE },
  async () => {
    const db = getFirestore()

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const todaySubmissions = await db
      .collection('submissions')
      .where('createdAt', '>=', Timestamp.fromDate(startOfDay))
      .get()

    const alreadySubmitted = new Set(todaySubmissions.docs.map((doc) => doc.data().userId as string))

    const users = await db.collection('users').get()
    const targets = users.docs
      .filter((doc) => !alreadySubmitted.has(doc.id))
      .map((doc) => doc.data().email as string)
      .filter(Boolean)

    if (targets.length === 0) {
      logger.info('Semua user sudah submit hari ini — tidak ada reminder yang dikirim.')
      return
    }

    // Dikirim satu per satu supaya alamat penerima tidak saling terlihat.
    for (const email of targets) {
      await sendEmail({
        to: email,
        subject: 'Belum submit karya hari ini?',
        html: layout(
          'Jaga streak kamu',
          'Kamu belum mengumpulkan karya hari ini. Satu link saja cukup untuk menyalakan kotak kalender hari ini.',
          { label: 'Submit karya', url: `${process.env.APP_URL ?? ''}/submit` },
        ),
      })
    }

    logger.info(`Reminder terkirim ke ${targets.length} user.`)
  },
)
