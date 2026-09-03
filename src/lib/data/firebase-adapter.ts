import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth'
import {
  Timestamp,
  addDoc,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { addDays, formatISO } from 'date-fns'
import type { AdminInvite, AppUser, LeaderboardEntry, Submission } from '@/types'
import type { SubmissionInput } from '@/lib/validators/submission'
import { buildLeaderboard } from '@/lib/selectors'
import { isPrimaryAdmin } from '@/lib/constants'
import { AppError, ERROR_COPY, toAppError, type DataAdapter } from './contract'
import { firebaseConfig } from './config'


const USERS = 'users'
const SUBMISSIONS = 'submissions'
const INVITES = 'adminInvites'

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

function mapUser(snapshot: QueryDocumentSnapshot<DocumentData>): AppUser {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    name: data.name ?? 'Tanpa nama',
    email: data.email ?? '',
    authProvider: data.authProvider ?? 'password',
    role: data.role === 'admin' ? 'admin' : 'user',
    photoUrl: data.photoUrl ?? null,
    createdAt: toIso(data.createdAt),
  }
}

function mapSubmission(snapshot: QueryDocumentSnapshot<DocumentData>): Submission {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    userId: data.userId,
    name: data.name ?? '',
    origin: data.origin ?? '',
    socialAccountUrl: data.socialAccountUrl ?? '',
    linkUrl: data.linkUrl ?? '',
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt ?? data.createdAt),
  }
}

function mapInvite(snapshot: QueryDocumentSnapshot<DocumentData>): AdminInvite {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    invitedEmail: data.invitedEmail ?? '',
    invitedBy: data.invitedBy ?? '',
    invitedByName: data.invitedByName ?? 'Admin',
    status: data.status ?? 'pending',
    createdAt: toIso(data.createdAt),
    expiresAt: toIso(data.expiresAt),
  }
}

/**
 * Adapter Firestore sesuai PRD bagian 9.
 * Otorisasi sebenarnya ditegakkan Firestore Security Rules (lihat firestore.rules);
 * pemeriksaan di sini hanya untuk memberi pesan error yang enak dibaca di UI.
 */
export class FirebaseAdapter implements DataAdapter {
  readonly kind = 'firebase' as const

  private app: FirebaseApp
  private auth: Auth
  private db: Firestore

  constructor() {
    this.app = initializeApp(firebaseConfig)
    this.auth = getAuth(this.app)
    this.db = getFirestore(this.app)

    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      connectFirestoreEmulator(this.db, '127.0.0.1', 8080)
    }
  }

  /** Membuat dokumen profil saat user pertama kali dikenali. */
  private async ensureProfile(firebaseUser: FirebaseUser, fallbackName?: string): Promise<AppUser> {
    const reference = doc(this.db, USERS, firebaseUser.uid)
    const snapshot = await getDoc(reference)

    if (snapshot.exists()) {
      const data = snapshot.data()
      return {
        id: firebaseUser.uid,
        name: data.name ?? fallbackName ?? firebaseUser.displayName ?? 'Tanpa nama',
        email: data.email ?? firebaseUser.email ?? '',
        authProvider: data.authProvider ?? 'password',
        role: data.role === 'admin' ? 'admin' : 'user',
        photoUrl: data.photoUrl ?? firebaseUser.photoURL ?? null,
        createdAt: toIso(data.createdAt),
      }
    }

    const provider = firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'password'
    const pendingInvite = await this.findPendingInvite(firebaseUser.email ?? '')

    const profile: AppUser = {
      id: firebaseUser.uid,
      name: fallbackName ?? firebaseUser.displayName ?? 'Tanpa nama',
      email: firebaseUser.email ?? '',
      authProvider: provider,
      role: pendingInvite ? 'admin' : 'user',
      photoUrl: firebaseUser.photoURL ?? null,
      createdAt: new Date().toISOString(),
    }

    await setDoc(reference, {
      name: profile.name,
      email: profile.email,
      authProvider: profile.authProvider,
      role: profile.role,
      photoUrl: profile.photoUrl,
      createdAt: serverTimestamp(),
    })

    if (pendingInvite) {
      await updateDoc(doc(this.db, INVITES, pendingInvite.id), { status: 'accepted' })
    }

    return profile
  }

  private async findPendingInvite(email: string) {
    if (!email) return null
    const snapshot = await getDocs(
      query(
        collection(this.db, INVITES),
        where('invitedEmail', '==', email.toLowerCase()),
        where('status', '==', 'pending'),
      ),
    )
    const match = snapshot.docs
      .map(mapInvite)
      .find((invite) => new Date(invite.expiresAt).getTime() > Date.now())
    return match ?? null
  }

  onAuthChange(callback: (user: AppUser | null) => void) {
    return onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (!firebaseUser) {
        callback(null)
        return
      }
      try {
        callback(await this.ensureProfile(firebaseUser))
      } catch {
        callback(null)
      }
    })
  }

  async signIn(email: string, password: string) {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email.trim(), password)
      return await this.ensureProfile(credential.user)
    } catch (error) {
      throw toAppError(error)
    }
  }

  async register(name: string, email: string, password: string) {
    try {
      const trimmedName = name.trim()
      const credential = await createUserWithEmailAndPassword(this.auth, email.trim(), password)
      await updateProfile(credential.user, { displayName: trimmedName })
      const profile = await this.ensureProfile(credential.user, trimmedName)
      // ensureProfile() juga dipanggil oleh listener onAuthChange (tanpa fallbackName)
      // yang bisa menang race dan membuat dokumen profil lebih dulu dengan nama kosong.
      // Pastikan nama yang benar-benar diketik user selalu jadi nilai akhir yang tersimpan.
      if (profile.name !== trimmedName) {
        await setDoc(doc(this.db, USERS, credential.user.uid), { name: trimmedName }, { merge: true })
      }
      return { ...profile, name: trimmedName }
    } catch (error) {
      throw toAppError(error)
    }
  }

  async signInWithGoogle() {
    try {
      const credential = await signInWithPopup(this.auth, new GoogleAuthProvider())
      return await this.ensureProfile(credential.user)
    } catch (error) {
      throw toAppError(error)
    }
  }

  async signOut() {
    await firebaseSignOut(this.auth)
  }

  async sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email.trim())
    } catch (error) {
      throw toAppError(error)
    }
  }

  async listUsers() {
    const snapshot = await getDocs(collection(this.db, USERS))
    return snapshot.docs.map(mapUser)
  }

  async getUser(userId: string) {
    const snapshot = await getDoc(doc(this.db, USERS, userId))
    if (!snapshot.exists()) throw new AppError('not-found', ERROR_COPY['not-found'])
    return mapUser(snapshot as QueryDocumentSnapshot<DocumentData>)
  }

  /**
   * Dibaca dari agregat pada dokumen user supaya user biasa tidak perlu
   * (dan tidak boleh) membaca seluruh koleksi submissions.
   * Field `totalKarya` dan `lastReachedAt` dipelihara Cloud Function.
   */
  async listLeaderboard(): Promise<LeaderboardEntry[]> {
    const snapshot = await getDocs(
      query(collection(this.db, USERS), where('totalKarya', '>', 0)),
    )

    return snapshot.docs
      .map((document) => {
        const data = document.data()
        const user = mapUser(document)
        return {
          rank: 0,
          userId: user.id,
          name: user.name,
          origin: data.origin ?? '—',
          photoUrl: user.photoUrl,
          total: data.totalKarya as number,
          reachedAt: toIso(data.lastReachedAt ?? data.createdAt),
        }
      })
      // Tie-break: yang lebih dulu mencapai total tersebut ada di atas (FR-06).
      .sort((a, b) => b.total - a.total || a.reachedAt.localeCompare(b.reachedAt))
      .map((entry, index) => ({ ...entry, rank: index + 1 }))
  }

  async recomputeLeaderboardAggregates(actor: AppUser): Promise<number> {
    if (actor.role !== 'admin') {
      throw new AppError('permission-denied', ERROR_COPY['permission-denied'])
    }

    try {
      const [submissions, users] = await Promise.all([this.listAllSubmissions(), this.listUsers()])
      const entries = buildLeaderboard(submissions, users)

      const batch = writeBatch(this.db)
      for (const entry of entries) {
        batch.set(
          doc(this.db, USERS, entry.userId),
          {
            totalKarya: entry.total,
            origin: entry.origin,
            lastReachedAt: Timestamp.fromDate(new Date(entry.reachedAt)),
          },
          { merge: true },
        )
      }
      if (entries.length > 0) await batch.commit()

      return entries.length
    } catch (error) {
      throw toAppError(error)
    }
  }

  async listSubmissionsByUser(userId: string) {
    const snapshot = await getDocs(
      query(
        collection(this.db, SUBMISSIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
      ),
    )
    return snapshot.docs.map(mapSubmission)
  }

  async listAllSubmissions() {
    const snapshot = await getDocs(
      query(collection(this.db, SUBMISSIONS), orderBy('createdAt', 'desc')),
    )
    return snapshot.docs.map(mapSubmission)
  }

  async createSubmission(user: AppUser, input: SubmissionInput) {
    try {
      const reference = await addDoc(collection(this.db, SUBMISSIONS), {
        userId: user.id,
        ...input,
        // Tanggal ditentukan server, bukan jam klien (PRD bagian 11).
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      // Leaderboard (FR-06) dihitung dari agregat totalKarya di dokumen user sendiri —
      // dijaga di client, bukan Cloud Function, karena Cloud Functions ditunda (Spark plan).
      await setDoc(
        doc(this.db, USERS, user.id),
        { totalKarya: increment(1), origin: input.origin, lastReachedAt: serverTimestamp() },
        { merge: true },
      )
      const now = new Date().toISOString()
      return { id: reference.id, userId: user.id, ...input, createdAt: now, updatedAt: now }
    } catch (error) {
      throw toAppError(error)
    }
  }

  async updateSubmission(submissionId: string, actor: AppUser, input: SubmissionInput) {
    const reference = doc(this.db, SUBMISSIONS, submissionId)
    const snapshot = await getDoc(reference)
    if (!snapshot.exists()) throw new AppError('not-found', ERROR_COPY['not-found'])
    if (snapshot.data().userId !== actor.id) {
      throw new AppError('permission-denied', ERROR_COPY['permission-denied'])
    }
    try {
      await updateDoc(reference, { ...input, updatedAt: serverTimestamp() })
    } catch (error) {
      throw toAppError(error)
    }
    return {
      id: submissionId,
      userId: actor.id,
      ...input,
      createdAt: toIso(snapshot.data().createdAt),
      updatedAt: new Date().toISOString(),
    }
  }

  async deleteSubmission(submissionId: string, actor: AppUser) {
    const reference = doc(this.db, SUBMISSIONS, submissionId)
    const snapshot = await getDoc(reference)
    if (!snapshot.exists()) throw new AppError('not-found', ERROR_COPY['not-found'])
    const ownerId = snapshot.data().userId as string
    if (ownerId !== actor.id && actor.role !== 'admin') {
      throw new AppError('permission-denied', ERROR_COPY['permission-denied'])
    }
    try {
      await deleteDoc(reference)
      // Koreksi totalKarya pemilik ASLI submission — bukan actor, supaya benar juga
      // saat admin yang menghapus milik orang lain (izin rules: lihat firestore.rules).
      await setDoc(doc(this.db, USERS, ownerId), { totalKarya: increment(-1) }, { merge: true })
    } catch (error) {
      throw toAppError(error)
    }
  }

  async listInvites() {
    const snapshot = await getDocs(
      query(collection(this.db, INVITES), orderBy('createdAt', 'desc')),
    )
    return snapshot.docs.map(mapInvite)
  }

  async createInvite(actor: AppUser, email: string) {
    const normalized = email.trim().toLowerCase()
    const users = await getDocs(
      query(collection(this.db, USERS), where('email', '==', normalized)),
    )
    const existing = users.docs.map(mapUser)[0]
    if (existing?.role === 'admin') {
      throw new AppError('invite/already-admin', ERROR_COPY['invite/already-admin'])
    }

    const now = new Date()
    const expiresAt = addDays(now, 7)
    const payload = {
      invitedEmail: normalized,
      invitedBy: actor.id,
      invitedByName: actor.name,
      status: existing ? 'accepted' : 'pending',
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    }

    try {
      const reference = await addDoc(collection(this.db, INVITES), payload)
      if (existing) {
        await updateDoc(doc(this.db, USERS, existing.id), { role: 'admin' })
      }
      return {
        id: reference.id,
        invitedEmail: normalized,
        invitedBy: actor.id,
        invitedByName: actor.name,
        status: existing ? 'accepted' : 'pending',
        createdAt: formatISO(now),
        expiresAt: formatISO(expiresAt),
      } satisfies AdminInvite
    } catch (error) {
      throw toAppError(error)
    }
  }

  async revokeInvite(inviteId: string) {
    await deleteDoc(doc(this.db, INVITES, inviteId))
  }

  async demoteAdmin(actor: AppUser, targetUserId: string) {
    if (!isPrimaryAdmin(actor)) {
      throw new AppError('permission-denied', ERROR_COPY['permission-denied'])
    }
    if (targetUserId === actor.id) {
      throw new AppError('permission-denied', ERROR_COPY['permission-denied'])
    }
    try {
      await updateDoc(doc(this.db, USERS, targetUserId), { role: 'user' })
    } catch (error) {
      throw toAppError(error)
    }
  }
}
