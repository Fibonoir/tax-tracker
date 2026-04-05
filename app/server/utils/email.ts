interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(options: EmailOptions) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'Chiaro <onboarding@resend.dev>'

  if (!apiKey) {
    console.log(`[email] No RESEND_API_KEY — printing to console.`)
    console.log(`  To: ${options.to}`)
    console.log(`  Subject: ${options.subject}`)
    console.log(`  Body:\n${options.text}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      ...(options.html ? { html: options.html } : {}),
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => 'unknown')
    console.error(`[email] Resend error ${res.status}: ${detail}`)
    throw new Error(`Email send failed (${res.status})`)
  }
}
