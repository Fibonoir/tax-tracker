import { createHmac, timingSafeEqual } from 'node:crypto'
import { createError } from 'h3'

const STRIPE_API_BASE_URL = 'https://api.stripe.com/v1'

function parseStripeError(body: string) {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } }
    return parsed.error?.message || body
  } catch {
    return body
  }
}

export function requireStripeSecret(secret: string | null | undefined) {
  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe secret key is missing.',
    })
  }

  return secret
}

export async function stripePost<T>(path: string, body: URLSearchParams, secretKey: string): Promise<T> {
  const response = await fetch(`${STRIPE_API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const text = await response.text()

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: `Stripe API error: ${parseStripeError(text)}`,
    })
  }

  return (text ? JSON.parse(text) : {}) as T
}

function safeHexCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'hex')
  const rightBuffer = Buffer.from(right, 'hex')

  if (leftBuffer.length !== rightBuffer.length) return false
  return timingSafeEqual(leftBuffer, rightBuffer)
}

export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string | null | undefined,
  webhookSecret: string,
  toleranceSeconds = 300,
) {
  if (!signatureHeader) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing Stripe signature header.',
    })
  }

  const items = signatureHeader.split(',').map(part => part.trim())
  const timestamp = items.find(part => part.startsWith('t='))?.slice(2)
  const signatures = items.filter(part => part.startsWith('v1=')).map(part => part.slice(3))

  if (!timestamp || signatures.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Stripe signature header.',
    })
  }

  const signedPayload = `${timestamp}.${payload}`
  const expected = createHmac('sha256', webhookSecret).update(signedPayload, 'utf8').digest('hex')
  const verified = signatures.some(signature => safeHexCompare(signature, expected))

  if (!verified) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Stripe webhook signature.',
    })
  }

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp))
  if (Number.isNaN(age) || age > toleranceSeconds) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Stripe webhook signature expired.',
    })
  }
}
