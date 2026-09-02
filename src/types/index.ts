export type Role = 'user' | 'admin'

export interface AppUser {
  id: string
  name: string
  email: string
  authProvider: 'password' | 'google'
  role: Role
  photoUrl: string | null
  createdAt: string
}

export interface Submission {
  id: string
  userId: string
  name: string
  origin: string
  socialAccountUrl: string
  linkUrl: string
  createdAt: string
  updatedAt: string
}

export type InviteStatus = 'pending' | 'accepted' | 'expired'

export interface AdminInvite {
  id: string
  invitedEmail: string
  invitedBy: string
  invitedByName: string
  status: InviteStatus
  createdAt: string
  expiresAt: string
}

/** Derived per user — dihitung dari submissions, bukan sumber kebenaran terpisah. */
export interface ActivityDay {
  date: string // yyyy-MM-dd
  isActive: boolean
  submissionCount: number
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  origin: string
  photoUrl: string | null
  total: number
  /** createdAt submission ke-N yang menggenapkan total — dipakai untuk tie-break. */
  reachedAt: string
}

export interface RespondenRow {
  userId: string
  name: string
  origin: string
  email: string
  photoUrl: string | null
  total: number
  lastSubmissionAt: string
}

export interface DateRange {
  start: string | null
  end: string | null
}

export interface AdminNotification {
  id: string
  submissionId: string
  actorName: string
  message: string
  createdAt: string
  read: boolean
}
