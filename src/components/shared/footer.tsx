import { useState } from 'react'
import { Coffee } from 'lucide-react'
import qrisImage from '@/assets/qris.jpeg'
import { Modal } from '@/components/ui/modal'

const INSTAGRAM_URL = 'https://www.instagram.com/yasraffad_sensei/'

export function Footer() {
  const [qrisOpen, setQrisOpen] = useState(false)

  return (
    <>
      <footer className="py-6 text-center text-[12px] text-ink-faint">
        development by{' '}
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand-600 hover:text-brand-800"
        >
          @yasraffad_sensei
        </a>
        <span className="mx-1.5">|</span>
        <button
          type="button"
          onClick={() => setQrisOpen(true)}
          className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-800"
        >
          <Coffee className="h-3.5 w-3.5" aria-hidden />
          trakteer me coffee
        </button>
      </footer>

      <Modal
        open={qrisOpen}
        onOpenChange={setQrisOpen}
        size="sm"
        title="Trakteer saya kopi ☕"
        description="Scan QRIS ini lewat e-wallet atau m-banking kamu — makasih banyak!"
      >
        <img
          src={qrisImage}
          alt="Kode QRIS untuk trakteer kopi"
          className="w-full rounded-card border border-line"
        />
      </Modal>
    </>
  )
}
