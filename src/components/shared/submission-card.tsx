import { ExternalLink, Link2, Pencil, Trash2 } from 'lucide-react'
import type { Submission } from '@/types'
import { formatDateTime, formatShortDate } from '@/lib/dates'
import { cn, hostnameOf } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SubmissionCardProps {
  submission: Submission
  onEdit?: (submission: Submission) => void
  onDelete?: (submission: Submission) => void
  onDark?: boolean
  showOwner?: boolean
}

export function SubmissionCard({
  submission,
  onEdit,
  onDelete,
  onDark,
  showOwner,
}: SubmissionCardProps) {
  return (
    <article
      className={cn(
        'group flex flex-col gap-3 rounded-card p-4 transition-all sm:flex-row sm:items-center sm:justify-between',
        onDark
          ? 'border border-white/10 bg-white/[0.04] hover:bg-white/[0.07]'
          : 'fin-card hover:shadow-card-md',
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            'mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-control',
            onDark ? 'bg-white/10 text-brand-300' : 'bg-brand-100 text-brand-600',
          )}
        >
          <Link2 className="h-[18px] w-[18px]" aria-hidden />
        </span>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn('text-[14px] font-semibold', onDark ? 'text-white' : 'text-ink')}>
              {formatShortDate(submission.createdAt)}
            </p>
            <Badge tone={onDark ? 'onDark' : 'brand'}>{hostnameOf(submission.linkUrl)}</Badge>
            {submission.updatedAt !== submission.createdAt ? (
              <Badge tone={onDark ? 'onDark' : 'neutral'}>diedit</Badge>
            ) : null}
          </div>

          <p
            className={cn(
              'truncate font-mono text-[12px]',
              onDark ? 'text-slate-400' : 'text-ink-muted',
            )}
            title={submission.linkUrl}
          >
            {submission.linkUrl}
          </p>

          <p className={cn('text-[12px]', onDark ? 'text-slate-500' : 'text-ink-faint')}>
            {showOwner ? `${submission.name} · ${submission.origin} · ` : ''}
            {formatDateTime(submission.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:pl-3">
        <Button
          variant={onDark ? 'onDark' : 'secondary'}
          size="sm"
          onClick={() => window.open(submission.linkUrl, '_blank', 'noopener,noreferrer')}
        >
          See the Link
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Button>

        {onEdit ? (
          <Button
            variant={onDark ? 'ghostDark' : 'ghost'}
            size="icon"
            aria-label={`Edit karya ${formatShortDate(submission.createdAt)}`}
            onClick={() => onEdit(submission)}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}

        {onDelete ? (
          <Button
            variant={onDark ? 'ghostDark' : 'ghost'}
            size="icon"
            aria-label={`Hapus karya ${formatShortDate(submission.createdAt)}`}
            className={onDark ? 'hover:text-[#FCA5A5]' : 'hover:bg-[#FEE2E2] hover:text-[#B91C1C]'}
            onClick={() => onDelete(submission)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </article>
  )
}
