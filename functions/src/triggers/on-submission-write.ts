import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import * as logger from 'firebase-functions/logger'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { layout, sendEmail } from '../lib/email'

const db = () => getFirestore()

/**
 * FR-02 + FR-10 — notifikasi admin saat ada submission baru.
 *
 * Agregat `totalKarya` untuk leaderboard (FR-06) SENGAJA tidak lagi dijaga di sini —
 * dipindah ke client (lihat createSubmission/deleteSubmission di
 * src/lib/data/firebase-adapter.ts) supaya leaderboard tetap jalan penuh tanpa
 * Cloud Functions (plan Spark). Jangan tambah balik logika increment/decrement
 * totalKarya di sini kecuali logika sisi client itu juga dihapus — kalau tidak,
 * angkanya akan double-count.
 */
export const onSubmissionCreated = onDocumentCreated('submissions/{submissionId}', async (event) => {
  const data = event.data?.data()
  if (!data) return

  const admins = await db().collection('users').where('role', '==', 'admin').get()
  const recipients = admins.docs.map((doc) => doc.data().email as string).filter(Boolean)

  if (recipients.length === 0) {
    logger.warn('Tidak ada admin aktif untuk dinotifikasi.')
    return
  }

  await db().collection('adminNotifications').add({
    submissionId: event.params.submissionId,
    actorName: data.name,
    message: `${data.name} baru saja submit karya baru.`,
    createdAt: FieldValue.serverTimestamp(),
    read: false,
  })

  await sendEmail({
    to: recipients,
    subject: `Karya baru dari ${data.name}`,
    html: layout(
      'Submission baru masuk',
      `<strong>${data.name}</strong> (${data.origin}) baru saja mengumpulkan karya.<br/>Link: ${data.linkUrl}`,
      { label: 'Buka dashboard admin', url: `${process.env.APP_URL ?? ''}/admin` },
    ),
  })
})
