import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppUser, Submission } from '@/types'
import type { SubmissionInput } from '@/lib/validators/submission'
import { getAdapter } from '@/lib/data'
import { notifyAdmins } from '@/features/notifications/notification-store'
import { track } from '@/lib/analytics'

export const queryKeys = {
  users: ['users'] as const,
  mySubmissions: (userId: string) => ['submissions', 'mine', userId] as const,
  allSubmissions: ['submissions', 'all'] as const,
  leaderboard: ['leaderboard'] as const,
  invites: ['invites'] as const,
}

export function useUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => getAdapter().listUsers(),
    enabled,
  })
}

export function useLeaderboard(enabled = true) {
  return useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: () => getAdapter().listLeaderboard(),
    enabled,
  })
}

export function useMySubmissions(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mySubmissions(userId ?? 'anonymous'),
    queryFn: () => getAdapter().listSubmissionsByUser(userId as string),
    enabled: Boolean(userId),
  })
}

export function useAllSubmissions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.allSubmissions,
    queryFn: () => getAdapter().listAllSubmissions(),
    enabled,
  })
}

/** Invalidasi semua turunan submission: kalender, histori, leaderboard, tabel admin. */
function useInvalidateSubmissions() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['submissions'] })
    void queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard })
    void queryClient.invalidateQueries({ queryKey: queryKeys.users })
  }
}

export function useCreateSubmission(user: AppUser | null) {
  const invalidate = useInvalidateSubmissions()
  return useMutation({
    mutationFn: (input: SubmissionInput) => getAdapter().createSubmission(user as AppUser, input),
    onSuccess: (submission) => {
      // FR-02: setiap submission baru memicu notifikasi ke seluruh admin.
      notifyAdmins(submission)
      track('submission_created', { submissionId: submission.id })
      invalidate()
    },
  })
}

export function useUpdateSubmission(user: AppUser | null) {
  const invalidate = useInvalidateSubmissions()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubmissionInput }) =>
      getAdapter().updateSubmission(id, user as AppUser, input),
    onSuccess: invalidate,
  })
}

export function useDeleteSubmission(user: AppUser | null) {
  const invalidate = useInvalidateSubmissions()
  return useMutation({
    mutationFn: (submission: Submission) =>
      getAdapter().deleteSubmission(submission.id, user as AppUser),
    onSuccess: (_data, submission) => {
      track('submission_deleted', { submissionId: submission.id })
      invalidate()
    },
  })
}
