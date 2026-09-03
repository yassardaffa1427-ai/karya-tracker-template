import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CalendarCheck2, KeyRound, Trophy, Users } from 'lucide-react'
import logo from '@/assets/logo.jpg'
import { AppError, DEMO_ACCOUNTS, isMockMode } from '@/lib/data'
import { useAuth } from '@/features/auth/auth-context'
import { loginSchema, registerSchema, resetSchema, type LoginInput, type RegisterInput, type ResetInput } from '@/lib/validators/auth'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { Footer } from '@/components/shared/footer'
import { track } from '@/lib/analytics'

const HIGHLIGHTS = [
  { icon: CalendarCheck2, title: 'Kalender aktivitas', body: 'Lihat konsistensi berkarya kamu dalam satu grid setahun penuh.' },
  { icon: Trophy, title: 'Leaderboard', body: 'Ranking kontributor berdasarkan total karya yang terkumpul.' },
  { icon: Users, title: 'Dashboard admin', body: 'Pantau seluruh responden dan histori submission mereka.' },
]

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isLogin = mode === 'login'

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="dark-scope relative hidden flex-col justify-between overflow-hidden bg-darkbg-main p-12 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-brand-600/35 blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-16 h-[380px] w-[380px] rounded-full bg-brand-500/25 blur-[120px]"
        />

        <div className="relative flex items-center gap-2.5">
          <img src={logo} alt="" className="h-9 w-9 rounded-xl object-cover" />
          <span className="text-[16px] font-bold tracking-tight text-white">
            vilism<span className="text-brand-400">.checker</span>
          </span>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <h1 className="max-w-md text-[32px] font-bold leading-10 tracking-tight text-white">
              Kumpulkan karya, lihat konsistensimu tumbuh.
            </h1>
            <p className="max-w-md text-[14px] leading-6 text-slate-400">
              Satu tempat untuk submit link karya, memantau riwayat sendiri, dan memberi admin
              visibilitas penuh tanpa rekap manual.
            </p>
          </div>

          <ul className="space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item.title}
                className="flex gap-3 rounded-card border border-white/10 bg-white/[0.04] p-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-brand-600/25 text-brand-300">
                  <item.icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <div className="space-y-0.5">
                  <p className="text-[14px] font-semibold text-white">{item.title}</p>
                  <p className="text-[13px] leading-5 text-slate-400">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] text-slate-500">vilism.checker v1.0 — Production</p>
      </section>

      <section className="flex flex-col items-center justify-center bg-surface px-5 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          {isLogin ? <LoginForm /> : <RegisterForm />}
        </div>
        <Footer />
      </section>
    </div>
  )
}

function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-6 space-y-1.5">
      <div className="mb-5 flex items-center gap-2.5 lg:hidden">
        <img src={logo} alt="" className="h-8 w-8 rounded-xl object-cover" />
        <span className="text-[15px] font-bold tracking-tight text-ink">
          vilism<span className="text-brand-600">.checker</span>
        </span>
      </div>
      <h2 className="text-[28px] font-bold leading-9 tracking-tight text-ink">{title}</h2>
      <p className="text-[14px] text-ink-muted">{subtitle}</p>
    </header>
  )
}

function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <Button type="button" variant="secondary" size="block" onClick={onClick} loading={loading}>
      {!loading ? <GoogleMark /> : null}
      Lanjut dengan Google
    </Button>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 7 8.9 4.8 12 4.8Z" />
    </svg>
  )
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[12px] font-medium text-ink-faint">atau</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}

function DemoHint() {
  if (!isMockMode()) return null
  return (
    <div className="mt-6 rounded-card border border-brand-200 bg-brand-50 p-4">
      <p className="text-[12px] font-semibold text-brand-700">Akun demo (mode lokal)</p>
      <ul className="mt-2 space-y-1">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.email} className="font-mono text-[11px] text-brand-700/80">
            {account.label}: {account.email} / {account.password}
          </li>
        ))}
      </ul>
    </div>
  )
}

function LoginForm() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginInput) {
    try {
      const user = await signIn(values.email, values.password)
      if (user.role === 'admin') track('admin_login')
      toast.success(`Selamat datang kembali, ${user.name.split(' ')[0]}!`)
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true })
    } catch (error) {
      const message = error instanceof AppError ? error.message : 'Gagal masuk. Coba lagi.'
      form.setError('password', { message })
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      const user = await signInWithGoogle()
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true })
    } catch (error) {
      toast.error(error instanceof AppError ? error.message : 'Login Google gagal.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <>
      <AuthHeader title="Masuk" subtitle="Lanjutkan mengumpulkan karya dan pantau konsistensimu." />

      <GoogleButton onClick={handleGoogle} loading={googleLoading} />
      <Divider />

      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email" required error={form.formState.errors.email?.message}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              aria-describedby={describedBy}
              invalid={invalid}
              {...form.register('email')}
            />
          )}
        </Field>

        <Field label="Password" required error={form.formState.errors.password?.message}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              placeholder="Minimal 8 karakter"
              aria-describedby={describedBy}
              invalid={invalid}
              {...form.register('password')}
            />
          )}
        </Field>

        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="text-[13px] font-semibold text-brand-600 hover:text-brand-800"
        >
          Lupa password?
        </button>

        <Button type="submit" size="block" loading={form.formState.isSubmitting}>
          Masuk
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-muted">
        Belum punya akun?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-800">
          Daftar sekarang
        </Link>
      </p>

      <DemoHint />
      <ResetPasswordModal open={resetOpen} onOpenChange={setResetOpen} />
    </>
  )
}

function RegisterForm() {
  const { register: registerUser, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [googleLoading, setGoogleLoading] = useState(false)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  async function onSubmit(values: RegisterInput) {
    try {
      const user = await registerUser(values.name, values.email, values.password)
      toast.success('Akun berhasil dibuat. Selamat berkarya!')
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true })
    } catch (error) {
      if (error instanceof AppError && error.code === 'auth/email-in-use') {
        form.setError('email', { message: error.message })
        return
      }
      toast.error(error instanceof AppError ? error.message : 'Gagal mendaftar. Coba lagi.')
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      const user = await signInWithGoogle()
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true })
    } catch (error) {
      toast.error(error instanceof AppError ? error.message : 'Login Google gagal.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <>
      <AuthHeader title="Buat akun" subtitle="Daftar gratis dan mulai kumpulkan karyamu hari ini." />

      <GoogleButton onClick={handleGoogle} loading={googleLoading} />
      <Divider />

      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Nama lengkap" required error={form.formState.errors.name?.message}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              autoComplete="name"
              placeholder="Nama kamu"
              aria-describedby={describedBy}
              invalid={invalid}
              {...form.register('name')}
            />
          )}
        </Field>

        <Field label="Email" required error={form.formState.errors.email?.message}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              aria-describedby={describedBy}
              invalid={invalid}
              {...form.register('email')}
            />
          )}
        </Field>

        <Field
          label="Password"
          required
          hint="Minimal 8 karakter."
          error={form.formState.errors.password?.message}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              placeholder="Buat password"
              aria-describedby={describedBy}
              invalid={invalid}
              {...form.register('password')}
            />
          )}
        </Field>

        <Button type="submit" size="block" loading={form.formState.isSubmitting}>
          Daftar
        </Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-ink-muted">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-800">
          Masuk
        </Link>
      </p>

      <DemoHint />
    </>
  )
}

function ResetPasswordModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { sendPasswordReset } = useAuth()
  const form = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: ResetInput) {
    await sendPasswordReset(values.email)
    toast.success('Kalau email terdaftar, tautan reset sudah dikirim.')
    form.reset()
    onOpenChange(false)
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title="Reset password"
      description="Kami kirim tautan reset ke email kamu."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} loading={form.formState.isSubmitting}>
            <KeyRound className="h-4 w-4" aria-hidden />
            Kirim tautan
          </Button>
        </>
      }
    >
      <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
        <Field label="Email" required error={form.formState.errors.email?.message}>
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
