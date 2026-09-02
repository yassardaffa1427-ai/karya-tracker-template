import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppUser } from '@/types'
import { getAdapter } from '@/lib/data'
import { queryKeys } from '@/features/submissions/queries'
import { track } from '@/lib/analytics'

export function useInvites(enabled = true) {
  return useQuery({
    queryKey: queryKeys.invites,
    queryFn: () => getAdapter().listInvites(),
    enabled,
  })
}

export function useCreateInvite(actor: AppUser | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => getAdapter().createInvite(actor as AppUser, email),
    onSuccess: () => {
      track('admin_invite_sent')
      void queryClient.invalidateQueries({ queryKey: queryKeys.invites })
      void queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}

export function useRevokeInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (inviteId: string) => getAdapter().revokeInvite(inviteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invites }),
  })
}

/**
 * Backfill satu kali untuk submission yang dibuat sebelum totalKarya mulai dijaga
 * otomatis (lihat createSubmission/deleteSubmission di firebase-adapter.ts).
 */
export function useRecomputeLeaderboard(actor: AppUser | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => getAdapter().recomputeLeaderboardAggregates(actor as AppUser),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard })
      void queryClient.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}
