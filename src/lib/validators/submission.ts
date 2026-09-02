import { z } from 'zod'

const urlField = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .refine((value) => {
      try {
        const parsed = new URL(value)
        return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch {
        return false
      }
    }, 'Format link tidak valid')

export const submissionSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(80, 'Nama maksimal 80 karakter'),
  origin: z.string().trim().min(1, 'Asal wajib diisi').max(80, 'Asal maksimal 80 karakter'),
  socialAccountUrl: urlField('Akun sosmed'),
  linkUrl: urlField('Link URL'),
})

export type SubmissionInput = z.infer<typeof submissionSchema>
