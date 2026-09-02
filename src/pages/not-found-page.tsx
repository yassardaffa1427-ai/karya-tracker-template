import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-surface px-6">
      <div className="fin-card max-w-md space-y-4 p-10 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-600">
          <Compass className="h-5 w-5" aria-hidden />
        </div>
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold leading-9 tracking-tight text-ink">404</h1>
          <p className="text-[14px] text-ink-muted">
            Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          </p>
        </div>
        <Button onClick={() => (window.location.href = '/')}>
          Kembali ke dashboard
        </Button>
        <p className="text-[12px] text-ink-faint">
          Atau buka <Link to="/leaderboard" className="font-semibold text-brand-600">leaderboard</Link>.
        </p>
      </div>
    </div>
  )
}
