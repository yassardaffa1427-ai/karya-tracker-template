import { forwardRef, useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => React.ReactNode
}

export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  const invalid = Boolean(error)

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-semibold text-ink">
        {label}
        {required ? <span className="ml-0.5 text-[#EF4444]">*</span> : null}
      </label>
      {children({ id, describedBy: error || hint ? messageId : undefined, invalid })}
      {error ? (
        <p id={messageId} role="alert" className="flex items-center gap-1.5 text-[12px] font-medium text-[#B91C1C]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-[12px] text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-11 w-full rounded-control border bg-white px-3.5 text-[14px] text-ink transition-colors placeholder:text-ink-faint',
        invalid ? 'border-[#EF4444] bg-[#FEF2F2]' : 'border-line hover:border-slate-300',
        className,
      )}
      {...props}
    />
  ),
)

Input.displayName = 'Input'
