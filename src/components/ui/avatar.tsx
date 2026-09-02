import { cn, initials } from '@/lib/utils'

const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-[13px]',
  lg: 'h-12 w-12 text-[15px]',
}

export function Avatar({
  name,
  photoUrl,
  size = 'md',
  className,
}: {
  name: string
  photoUrl?: string | null
  size?: keyof typeof SIZES
  className?: string
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={cn('shrink-0 rounded-full border border-line object-cover', SIZES[size], className)}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold text-white',
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
