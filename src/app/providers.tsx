import { Component, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { AuthProvider } from '@/features/auth/auth-context'
import { Button } from '@/components/ui/button'

// Tanpa auto-retry agresif: kegagalan fetch ditawarkan lewat tombol "Coba lagi"
// sesuai bagian Error Handling di PRD.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: { retry: 0 },
  },
})

interface BoundaryState {
  error: Error | null
}

class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    // Titik pasang Sentry.captureException saat DSN sudah tersedia.
    console.error('[karya-tracker] unhandled error', error)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="grid min-h-screen place-items-center bg-surface px-6">
        <div className="fin-card max-w-md space-y-4 p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#FEE2E2] text-[#B91C1C]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h1 className="text-[18px] font-semibold text-ink">Aplikasi mengalami gangguan</h1>
            <p className="text-[13px] text-ink-muted">
              Terjadi error yang tidak tertangani. Muat ulang halaman untuk melanjutkan.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Muat ulang</Button>
        </div>
      </div>
    )
  }
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '14px',
                border: '1px solid #E2E8F0',
                fontSize: '13px',
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
