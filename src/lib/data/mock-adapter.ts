import { addDays, formatISO, isBefore, parseISO } from 'date-fns'
import type { AdminInvite, AppUser, LeaderboardEntry, Submission } from '@/types'
import type { SubmissionInput } from '@/lib/validators/submission'
import { AppError, ERROR_COPY, type DataAdapter } from './contract'
import { createSeedDatabase, type MockDatabase } from './seed'
import { buildLeaderboard } from '@/lib/selectors'

const DB_KEY = 'karya-tracker:db:v1'
const SESSION_KEY = 'karya-tracker:session:v1'
const LATENCY = 220

function wait() {
  return new Promise((resolve) => setTimeout(resolve, LATENCY))
}

function readDatabase(): MockDatabase {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw) as MockDatabase
  } catch {
    // storage tidak tersedia / korup - jatuh ke seed baru
  }
  const seeded = createSeedDatabase()
  writeDatabase(seeded)
  return seeded
}

function writeDatabase(db: MockDatabase) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // abaikan: mode private browsing
  }
}

function newId(prefix: string) {
  return prefix + '-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

/**
 * Adapter lokal untuk dev/preview tanpa kredensial Firebase.
 * Aturan permission di PRD bagian 8 tetap ditegakkan di sini supaya
 * perilaku UI identik dengan mode Firebase.
 */
export class MockAdapter implements DataAdapter {
  readonly kind = 'mock' as const

  private listeners = new Set<(user: AppUser | null) => void>()

  private get db() {
    return readDatabase()
  }

  private emit(user: AppUser | null) {
    for (const listener of this.listeners) listener(user)
  }

  private setSession(userId: string | null) {
    if (userId) localStorage.setItem(SESSION_KEY, userId)
    else localStorage.removeItem(SESSION_KEY)
  }

  private currentUser(): AppUser | null {
    const id = localStorage.getItem(SESSION_KEY)
    if (!id) return null
    return this.db.users.find((user) => user.id === id) ?? null
  }

  onAuthChange(callback: (user: AppUser | null) => void) {
    this.listeners.add(callback)
    // Beri satu tick agar konsumen sempat memasang state loading.
    setTimeout(() => callback(this.currentUser()), 60)
    return () => {
      this.listeners.delete(callback)
    }
  }

  async signIn(email: string, password: string) {
    await wait()
    const db = this.db
    const normalized = email.trim().toLowerCase()
    const user = db.users.find((item) => item.email.toLowerCase() === normalized)
    if (!user || db.passwords[user.email] !== password) {
      throw new AppError('auth/invalid-credentials', ERROR_COPY['auth/invalid-credentials'])
    }
    this.setSession(user.id)
    this.emit(user)
    return user
  }

  async register(name: string, email: string, password: string) {
    await wait()
    const db = this.db
    const normalized = email.trim().toLowerCase()
    if (db.users.some((item) => item.email.toLowerCase() === normalized)) {
      throw new AppError('auth/email-in-use', ERROR_COPY['auth/email-in-use'])
    }
    if (password.length < 8) {
      throw new AppError('auth/weak-password', ERROR_COPY['auth/weak-password'])
    }

    // FR-09: email dengan undangan admin yang masih berlaku langsung jadi admin.
    const invite = db.invites.find(
      (item) => item.invitedEmail.toLowerCase() === normalized && item.status === 'pending',
    )
    const inviteValid = invite ? isBefore(new Date(), parseISO(invite.expiresAt)) : false

    const user: AppUser = {
      id: newId('user'),
      name: name.trim(),
      email: normalized,
      authProvider: 'password',
      role: inviteValid ? 'admin' : 'user',
      photoUrl: null,
      createdAt: formatISO(new Date()),
    }

    db.users.push(user)
    db.passwords[user.email] = password
    if (invite) invite.status = inviteValid ? 'accepted' : 'expired'
    writeDatabase(db)

    this.setSession(user.id)
    this.emit(user)
    return user
  }

  async signInWithGoogle() {
    await wait()
    const db = this.db
    // Simulasi akun Google tetap: kalau emailnya sudah ada, tautkan ke akun
    // yang sama alih-alih membuat duplikat (FR-01 edge case).
    const email = 'demo.google@karyatracker.test'
    let user = db.users.find((item) => item.email === email)
    if (!user) {
      user = {
        id: newId('user'),
        name: 'Demo Google',
        email,
        authProvider: 'google',
        role: 'user',
        photoUrl: null,
        createdAt: formatISO(new Date()),
      }
      db.users.push(user)
      writeDatabase(db)
    }
    this.setSession(user.id)
    this.emit(user)
    return user
  }

  async signOut() {
    await wait()
    this.setSession(null)
    this.emit(null)
  }

  async sendPasswordReset(email: string) {
    await wait()
    // Sengaja tidak membocorkan keberadaan akun - sama seperti perilaku Firebase.
    void email
  }

  async listUsers() {
    await wait()
    return [...this.db.users]
  }

  async getUser(userId: string) {
    await wait()
    const user = this.db.users.find((item) => item.id === userId)
    if (!user) throw new AppError('not-found', ERROR_COPY['not-found'])
    return user
  }

  async listLeaderboard(): Promise<LeaderboardEntry[]> {
    await wait()
    const db = this.db
    return buildLeaderboard(db.submissions, db.users)
  }

  async recomputeLeaderboardAggregates(): Promise<number> {
    // Mock selalu menghitung leaderboard on-the-fly dari array in-memory (lihat
    // listLeaderboard di atas) — tidak ada agregat tersimpan yang perlu di-backfill.
    await wait()
    return buildLeaderboard(this.db.submissions, this.db.users).length
  }

  async listSubmissionsByUser(userId: string) {
    await wait()
    return this.db.submissions
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async listAllSubmissions() {
    await wait()
    return [...this.db.submissions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async createSubmission(user: AppUser, input: SubmissionInput) {
    await wait()
    const db = this.db
    const now = formatISO(new Date())
    const submission: Submission = {
      id: newId('sub'),
      userId: user.id,
      ...input,
      createdAt: now,
      updatedAt: now,
    }
    db.submissions.push(submission)
    writeDatabase(db)
    return submission
  }

  async updateSubmission(submissionId: string, actor: AppUser, input: SubmissionInput) {
    await wait()
    const db = this.db
    const submission = db.submissions.find((item) => item.id === submissionId)
    if (!submission) throw new AppError('not-found', ERROR_COPY['not-found'])
    // PRD bagian 8: admin tidak boleh mengedit submission siapa pun.
    if (submission.userId !== actor.id) {
      throw new AppError('permission-denied', ERROR_COPY['permission-denied'])
    }
    Object.assign(submission, input, { updatedAt: formatISO(new Date()) })
    writeDatabase(db)
    return submission
  }

  async deleteSubmission(submissionId: string, actor: AppUser) {
    await wait()
    const db = this.db
    const submission = db.submissions.find((item) => item.id === submissionId)
    if (!submission) throw new AppError('not-found', ERROR_COPY['not-found'])
    if (submission.userId !== actor.id && actor.role !== 'admin') {
      throw new AppError('permission-denied', ERROR_COPY['permission-denied'])
    }
    db.submissions = db.submissions.filter((item) => item.id !== submissionId)
    writeDatabase(db)
  }

  async listInvites() {
    await wait()
    const db = this.db
    let changed = false
    for (const invite of db.invites) {
      if (invite.status === 'pending' && isBefore(parseISO(invite.expiresAt), new Date())) {
        invite.status = 'expired'
        changed = true
      }
    }
    if (changed) writeDatabase(db)
    return [...db.invites].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async createInvite(actor: AppUser, email: string) {
    await wait()
    const db = this.db
    const normalized = email.trim().toLowerCase()
    const existing = db.users.find((item) => item.email.toLowerCase() === normalized)
    if (existing?.role === 'admin') {
      throw new AppError('invite/already-admin', ERROR_COPY['invite/already-admin'])
    }

    const now = new Date()
    const invite: AdminInvite = {
      id: newId('invite'),
      invitedEmail: normalized,
      invitedBy: actor.id,
      invitedByName: actor.name,
      status: 'pending',
      createdAt: formatISO(now),
      expiresAt: formatISO(addDays(now, 7)),
    }

    // User yang sudah punya akun langsung naik rolenya (FR-09 main flow).
    if (existing) {
      existing.role = 'admin'
      invite.status = 'accepted'
    }

    db.invites.push(invite)
    writeDatabase(db)
    return invite
  }

  async revokeInvite(inviteId: string) {
    await wait()
    const db = this.db
    db.invites = db.invites.filter((item) => item.id !== inviteId)
    writeDatabase(db)
  }
}

export function resetMockDatabase() {
  localStorage.removeItem(DB_KEY)
  localStorage.removeItem(SESSION_KEY)
}
