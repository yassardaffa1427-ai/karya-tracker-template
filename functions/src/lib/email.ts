import * as logger from 'firebase-functions/logger'

/**
 * Pembungkus tipis untuk layanan email pihak ketiga (PRD bagian 11 — Dependencies).
 * Tanpa EMAIL_SERVICE_API_KEY, email hanya dicatat ke log supaya emulator tetap jalan.
 */
export async function sendEmail(options: {
  to: string | string[]
  subject: string
  html: string
}): Promise<void> {
  const apiKey = process.env.EMAIL_SERVICE_API_KEY
  const from = process.env.EMAIL_FROM ?? 'Karya Tracker <no-reply@karyatracker.app>'

  if (!apiKey) {
    logger.info('[email:dry-run]', { to: options.to, subject: options.subject })
    return
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })

  if (error) {
    logger.error('[email:failed]', { to: options.to, error })
    throw new Error(`Gagal mengirim email: ${error.message}`)
  }
}

export function layout(title: string, body: string, cta?: { label: string; url: string }) {
  return `
    <div style="font-family:Inter,-apple-system,Segoe UI,sans-serif;background:#F4F5FA;padding:32px">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:32px">
        <h1 style="margin:0 0 12px;font-size:20px;color:#0F172A">${title}</h1>
        <div style="font-size:14px;line-height:22px;color:#64748B">${body}</div>
        ${
          cta
            ? `<a href="${cta.url}" style="display:inline-block;margin-top:24px;background:#2563EB;color:#fff;text-decoration:none;padding:12px 24px;border-radius:9999px;font-size:14px;font-weight:600">${cta.label}</a>`
            : ''
        }
      </div>
    </div>
  `
}
