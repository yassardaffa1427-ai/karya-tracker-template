import { z } from 'zod'

export const inviteAdminSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid'),
})

export type InviteAdminInput = z.infer<typeof inviteAdminSchema>
