import { onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore'
import * as logger from 'firebase-functions/logger'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { layout, sendEmail } from '../lib/email'

const db = () => getFirestore()

/**
 * FR-02 + FR-06 + FR-10.
 * Setiap karya baru: menaikkan agregat `totalKarya` di dokumen user (dipakai
 * leaderboard tanpa membaca seluruh koleksi submissions) dan memberi tahu
 * seluruh admin aktif.
 */
export const onSubmissionCreated = onDocumentCreated('submissions/{submissionId}', async (event) => {
  const data = event.data?.data()
  if (!data) return

  const userRef = db().collection('users').doc(data.userId as string)
  await userRef.set(
    {
      totalKarya: FieldValue.increment(1),
      origin: data.origin,
      // Waktu tercapainya total terbaru — dipakai sebagai tie-break leaderboard.
      lastReachedAt: data.createdAt ?? FieldValue.serverTimestamp(),
      lastSubmissionAt: data.createdAt ?? FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

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

/** Menjaga agregat leaderboard tetap akurat saat submission dihapus (FR-03/FR-08). */
export const onSubmissionDeleted = onDocumentDeleted('submissions/{submissionId}', async (event) => {
  const data = event.data?.data()
  if (!data) return

  await db()
    .collection('users')
    .doc(data.userId as string)
    .set({ totalKarya: FieldValue.increment(-1) }, { merge: true })
})
