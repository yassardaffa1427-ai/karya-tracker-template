import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import type { Submission } from '@/types'
import { AppError } from '@/lib/data'
import { submissionSchema, type SubmissionInput } from '@/lib/validators/submission'
import { useAuth } from '@/features/auth/auth-context'
import { useCreateSubmission, useUpdateSubmission } from './queries'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'

interface SubmissionFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Diisi saat mode edit; kosong berarti membuat karya baru. */
  submission?: Submission | null
  defaults?: Partial<SubmissionInput>
}

export function SubmissionFormModal({
  open,
  onOpenChange,
  submission,
  defaults,
}: SubmissionFormModalProps) {
  const { user } = useAuth()
  const createMutation = useCreateSubmission(user)
  const updateMutation = useUpdateSubmission(user)
  const isEdit = Boolean(submission)

  const form = useForm<SubmissionInput>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { name: '', origin: '', socialAccountUrl: '', linkUrl: '' },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: submission?.name ?? defaults?.name ?? user?.name ?? '',
      origin: submission?.origin ?? defaults?.origin ?? '',
      socialAccountUrl: submission?.socialAccountUrl ?? defaults?.socialAccountUrl ?? '',
      linkUrl: submission?.linkUrl ?? '',
    })
    // form sengaja tidak masuk dependency: reset hanya saat modal dibuka / target berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, submission, defaults?.name, defaults?.origin, defaults?.socialAccountUrl, user?.name])

  async function onSubmit(values: SubmissionInput) {
    try {
      if (submission) {
        await updateMutation.mutateAsync({ id: submission.id, input: values })
        toast.success('Karya berhasil diperbarui.')
      } else {
        await createMutation.mutateAsync(values)
        toast.success('Karya tersimpan. Kalender aktivitas hari ini sudah ditandai.')
      }
      onOpenChange(false)
    } catch (error) {
      // Isian form sengaja tidak direset supaya user bisa langsung mencoba lagi (FR-02).
      toast.error(error instanceof AppError ? error.message : 'Gagal menyimpan karya. Coba lagi.')
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <Modal
      open={open}
      onOpenChange={submitting ? () => undefined : onOpenChange}
      title={isEdit ? 'Edit karya' : 'Submit karya'}
      description={
        isEdit
          ? 'Perbarui data karya milikmu. Tanggal submission tidak berubah.'
          : 'Isi data berikut, lalu kirim. Butuh beberapa detik saja.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} loading={submitting}>
            {isEdit ? 'Simpan perubahan' : 'Kirim karya'}
          </Button>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama" required error={form.formState.errors.name?.message}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                placeholder="Nama lengkap"
                aria-describedby={describedBy}
                invalid={invalid}
                {...form.register('name')}
              />
            )}
          </Field>

          <Field label="Asal" required error={form.formState.errors.origin?.message}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                placeholder="Sekolah / kampus / kota"
                aria-describedby={describedBy}
                invalid={invalid}
                {...form.register('origin')}
              />
            )}
          </Field>
        </div>

        <Field
          label="Akun sosmed"
          required
          hint="Tautan lengkap, contoh: https://instagram.com/username"
          error={form.formState.errors.socialAccountUrl?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              inputMode="url"
              placeholder="https://instagram.com/username"
              aria-describedby={describedBy}
              invalid={invalid}
              {...form.register('socialAccountUrl')}
            />
          )}
        </Field>

        <Field
          label="Link URL karya"
          required
          hint="Link publik ke karya kamu — boleh sama dengan submission sebelumnya."
          error={form.formState.errors.linkUrl?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              inputMode="url"
              placeholder="https://..."
              aria-describedby={describedBy}
              invalid={invalid}
              {...form.register('linkUrl')}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}
