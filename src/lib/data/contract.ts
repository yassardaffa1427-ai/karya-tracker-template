import type { AdminInvite, AppUser, LeaderboardEntry, Submission } from '@/types'
import type { SubmissionInput } from '@/lib/validators/submission'

export type AppErrorCode =
  | 'auth/invalid-credentials'
  | 'auth/email-in-use'
  | 'auth/weak-password'
  | 'auth/popup-closed'
  | 'auth/unknown'
  | 'not-found'
  | 'permission-denied'
  | 'network'
  | 'invite/already-admin'
  | 'invite/expired'
  | 'unknown'

export class AppError extends Error {
  code: AppErrorCode

  constructor(code: AppErrorCode, message: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

export const ERROR_COPY: Record<AppErrorCode, string> = {
  'auth/invalid-credentials': 'Email atau password salah.',
  'auth/email-in-use': 'Email sudah terdaftar.',
  'auth/weak-password': 'Password minimal 8 karakter.',
  'auth/popup-closed': 'Proses login Google dibatalkan.',
  'auth/unknown': 'Gagal memproses autentikasi. Coba lagi.',
  'not-found': 'Data tidak ditemukan, mungkin sudah dihapus.',
  'permission-denied': 'Kamu tidak punya akses untuk aksi ini.',
  network: 'Koneksi bermasalah. Periksa jaringan lalu coba lagi.',
  'invite/already-admin': 'Email ini sudah menjadi admin.',
  'invite/expired': 'Undangan sudah kedaluwarsa.',
  unknown: 'Terjadi kesalahan. Coba lagi.',
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  const code = (error as { code?: string } | null)?.code ?? ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return new AppError('auth/invalid-credentials', ERROR_COPY['auth/invalid-credentials'])
    case 'auth/email-already-in-use':
      return new AppError('auth/email-in-use', ERROR_COPY['auth/email-in-use'])
    case 'auth/weak-password':
      return new AppError('auth/weak-password', ERROR_COPY['auth/weak-password'])
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return new AppError('auth/popup-closed', ERROR_COPY['auth/popup-closed'])
    case 'permission-denied':
      return new AppError('permission-denied', ERROR_COPY['permission-denied'])
    case 'unavailable':
    case 'auth/network-request-failed':
      return new AppError('network', ERROR_COPY.network)
    default:
      return new AppError('unknown', ERROR_COPY.unknown)
  }
}

export interface DataAdapter {
  readonly kind: 'firebase' | 'mock'

  /** Emits null saat belum/berhenti login. Mengembalikan fungsi unsubscribe. */
  onAuthChange(callback: (user: AppUser | null) => void): () => void

  signIn(email: string, password: string): Promise<AppUser>
  register(name: string, email: string, password: string): Promise<AppUser>
  signInWithGoogle(): Promise<AppUser>
  signOut(): Promise<void>
  sendPasswordReset(email: string): Promise<void>

  listUsers(): Promise<AppUser[]>
  getUser(userId: string): Promise<AppUser>

  /**
   * Ranking kontributor. Di Firestore dihitung dari agregat `totalKarya` pada
   * dokumen user (dipelihara Cloud Function), karena user biasa tidak boleh
   * membaca koleksi submissions milik orang lain.
   */
  listLeaderboard(): Promise<LeaderboardEntry[]>

  /**
   * Backfill satu kali: hitung ulang totalKarya/origin/lastReachedAt tiap user dari
   * seluruh koleksi submissions, lalu tulis ke dokumen users masing-masing. Dipakai
   * admin lewat halaman Admin Management untuk menyamakan agregat leaderboard dengan
   * submission yang sudah ada sebelum totalKarya mulai dijaga otomatis di
   * createSubmission/deleteSubmission.
   */
  recomputeLeaderboardAggregates(actor: AppUser): Promise<number>

  listSubmissionsByUser(userId: string): Promise<Submission[]>
  listAllSubmissions(): Promise<Submission[]>
  createSubmission(user: AppUser, input: SubmissionInput): Promise<Submission>
  updateSubmission(submissionId: string, actor: AppUser, input: SubmissionInput): Promise<Submission>
  deleteSubmission(submissionId: string, actor: AppUser): Promise<void>

  listInvites(): Promise<AdminInvite[]>
  createInvite(actor: AppUser, email: string): Promise<AdminInvite>
  revokeInvite(inviteId: string): Promise<void>
}
