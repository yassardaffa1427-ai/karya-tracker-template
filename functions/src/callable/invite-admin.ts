import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { layout, sendEmail } from '../lib/email'

const INVITE_TTL_DAYS = 7

/**
 * FR-09: hanya admin yang boleh mengundang admin baru; semua admin setara.
 * Role dibawa sebagai custom claim agar bisa dicek Firestore Security Rules.
 */
export const inviteAdmin = onCall<{ email: string }>(async (request) => {
  if (request.auth?.token.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Hanya admin yang bisa mengundang admin baru.')
  }

  const email = (request.data.email ?? '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new HttpsError('invalid-argument', 'Format email tidak valid.')
  }

  const db = getFirestore()
  const auth = getAuth()

  const existingUsers = await db.collection('users').where('email', '==', email).limit(1).get()
  const existing = existingUsers.docs[0]

  if (existing?.data().role === 'admin') {
    throw new HttpsError('already-exists', 'Email ini sudah menjadi admin.')
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000)

  const inviteRef = await db.collection('adminInvites').add({
    invitedEmail: email,
    invitedBy: request.auth?.uid,
    invitedByName: request.auth?.token.name ?? 'Admin',
    status: existing ? 'accepted' : 'pending',
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
  })

  // Akun yang sudah ada langsung naik role; yang belum punya akun menunggu invite diklik.
  if (existing) {
    await existing.ref.update({ role: 'admin' })
    await auth.setCustomUserClaims(existing.id, { role: 'admin' })
  }

  await sendEmail({
    to: email,
    subject: 'Kamu diundang menjadi admin Karya Tracker',
    html: layout(
      'Undangan admin',
      existing
        ? 'Akun kamu sekarang punya akses admin. Login ulang untuk menyegarkan izin.'
        : `Kamu diundang menjadi admin Karya Tracker. Tautan ini berlaku ${INVITE_TTL_DAYS} hari.`,
      { label: 'Terima undangan', url: `${process.env.APP_URL ?? ''}/register?invite=${inviteRef.id}` },
    ),
  })

  return { inviteId: inviteRef.id, status: existing ? 'accepted' : 'pending' }
})

/**
 * Dipanggil saat akun baru dibuat: kalau emailnya punya undangan yang masih
 * berlaku, rolenya dinaikkan; kalau lewat 7 hari, undangan ditandai kedaluwarsa.
 */
export const claimAdminInvite = onCall(async (request) => {
  const uid = request.auth?.uid
  const email = request.auth?.token.email?.toLowerCase()
  if (!uid || !email) throw new HttpsError('unauthenticated', 'Perlu login.')

  const db = getFirestore()
  const invites = await db
    .collection('adminInvites')
    .where('invitedEmail', '==', email)
    .where('status', '==', 'pending')
    .get()

  const valid = invites.docs.find((doc) => doc.data().expiresAt.toDate() > new Date())

  if (!valid) {
    await Promise.all(invites.docs.map((doc) => doc.ref.update({ status: 'expired' })))
    return { role: 'user' as const }
  }

  await valid.ref.update({ status: 'accepted' })
  await db.collection('users').doc(uid).set({ role: 'admin' }, { merge: true })
  await getAuth().setCustomUserClaims(uid, { role: 'admin' })

  return { role: 'admin' as const }
})
