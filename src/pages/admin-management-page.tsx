import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { MailPlus, ShieldCheck, Trash2, UserPlus } from 'lucide-react'
import type { AdminInvite } from '@/types'
import { AppError } from '@/lib/data'
import { formatShortDate } from '@/lib/dates'
import { inviteAdminSchema, type InviteAdminInput } from '@/lib/validators/invite'
import { useAuth } from '@/features/auth/auth-context'
import { useUsers } from '@/features/submissions/queries'
import {
  useCreateInvite,
  useInvites,
  useRevokeInvite,
} from '@/features/admin-management/queries'
import { AppShell, PageHeader } from '@/components/shared/app-shell'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { EmptyState, Skeleton } from '@/components/ui/states'

const STATUS_TONE = {
  pending: 'info',
  accepted: 'success',
  expired: 'danger',
} as const

const STATUS_LABEL = {
  pending: 'Menunggu',
  accepted: 'Diterima',
  expired: 'Kedaluwarsa',
} as const

export function AdminManagementPage() {
  const { user } = useAuth()
  const users = useUsers()
  const invites = useInvites()
  const revokeMutation = useRevokeInvite()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [pendingRevoke, setPendingRevoke] = useState<AdminInvite | null>(null)

  const admins = useMemo(
    () => (users.data ?? []).filter((item) => item.role === 'admin'),
    [users.data],
  )

  async function confirmRevoke() {
    if (!pendingRevoke) return
    try {
      await revokeMutation.mutateAsync(pendingRevoke.id)
      toast.success('Undangan dicabut.')
    } catch (error) {
      toast.error(error instanceof AppError ? error.message : 'Gagal mencabut undangan.')
    } finally {
      setPendingRevoke(null)
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Admin management"
        subtitle="Semua admin punya akses yang sama — tidak ada hierarki super-admin."
        actions={
          <Button variant="gradient" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden />
            Undang admin
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="fin-card p-5">
          <header className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-[18px] w-[18px] text-brand-600" aria-hidden />
            <h2 className="text-[18px] font-semibold leading-6 text-ink">
              Admin aktif ({admins.length})
            </h2>
          </header>

          {users.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-card" />
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {admins.map((admin) => (
                <li
                  key={admin.id}
                  className="flex items-center gap-3 rounded-card border border-line px-3.5 py-3"
                >
                  <Avatar name={admin.name} photoUrl={admin.photoUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-ink">
                      {admin.name}
                      {admin.id === user?.id ? (
                        <span className="ml-1.5 text-[11px] font-medium text-ink-faint">(kamu)</span>
                      ) : null}
                    </p>
                    <p className="truncate text-[12px] text-ink-muted">{admin.email}</p>
                  </div>
                  <Badge tone="brand">Admin</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="fin-card p-5">
          <header className="mb-4 flex items-center gap-2">
            <MailPlus className="h-[18px] w-[18px] text-brand-600" aria-hidden />
            <h2 className="text-[18px] font-semibold leading-6 text-ink">Undangan</h2>
          </header>

          {invites.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-card" />
              ))}
            </div>
          ) : (invites.data ?? []).length === 0 ? (
            <EmptyState
              icon={MailPlus}
              title="Belum ada undangan"
              description="Undang admin baru lewat email. Tautan undangan berlaku 7 hari."
              action={
                <Button variant="secondary" onClick={() => setInviteOpen(true)}>
                  Undang admin
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {(invites.data ?? []).map((invite) => (
                <li
                  key={invite.id}
                  className="flex flex-wrap items-center gap-3 rounded-card border border-line px-3.5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-ink">
                      {invite.invitedEmail}
                    </p>
                    <p className="truncate text-[12px] text-ink-faint">
                      Diundang {invite.invitedByName} · berlaku sampai{' '}
                      {formatShortDate(invite.expiresAt)}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[invite.status]}>{STATUS_LABEL[invite.status]}</Badge>
                  {invite.status !== 'accepted' ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Cabut undangan ${invite.invitedEmail}`}
                      className="hover:bg-[#FEE2E2] hover:text-[#B91C1C]"
                      onClick={() => setPendingRevoke(invite)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <InviteModal open={inviteOpen} onOpenChange={setInviteOpen} />

      <ConfirmDialog
        open={Boolean(pendingRevoke)}
        onOpenChange={(open) => !open && setPendingRevoke(null)}
        title="Cabut undangan ini?"
        description="Tautan undangan yang sudah dikirim tidak akan berlaku lagi."
        confirmLabel="Cabut"
        loading={revokeMutation.isPending}
        onConfirm={confirmRevoke}
      />
    </AppShell>
  )
}

function InviteModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { user } = useAuth()
  const createInvite = useCreateInvite(user)

  const form = useForm<InviteAdminInput>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: InviteAdminInput) {
    try {
      const invite = await createInvite.mutateAsync(values.email)
      toast.success(
        invite.status === 'accepted'
          ? 'Akun tersebut langsung dinaikkan menjadi admin.'
          : 'Undangan terkirim. Tautan berlaku 7 hari.',
      )
      form.reset()
      onOpenChange(false)
    } catch (error) {
      if (error instanceof AppError && error.code === 'invite/already-admin') {
        form.setError('email', { message: error.message })
        return
      }
      toast.error(error instanceof AppError ? error.message : 'Gagal mengirim undangan.')
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title="Undang admin baru"
      description="Admin baru punya akses penuh yang sama seperti kamu."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} loading={createInvite.isPending}>
            <MailPlus className="h-4 w-4" aria-hidden />
            Kirim undangan
          </Button>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <Field
          label="Email calon admin"
          required
          hint="Kalau emailnya sudah punya akun, rolenya langsung naik jadi admin."
          error={form.formState.errors.email?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              placeholder="nama@email.com"
              aria-describedby={describedBy}
              invalid={invalid}
              {...form.register('email')}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}
