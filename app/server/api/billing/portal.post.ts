import { getRequestURL, readBody } from 'h3'
import { requireStripeSecret, stripePost } from '~/server/utils/stripe'
import { ensureStripeCustomerId, resolveBillingRedirectUrl } from '~/server/utils/billing'
import { requireAppUser } from '~/server/utils/users'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)
  const body = await readBody<{ returnUrl?: string }>(event)

  const config = useRuntimeConfig()
  const secretKey = requireStripeSecret(config.stripeSecretKey ?? process.env.STRIPE_SECRET_KEY)
  const origin = getRequestURL(event).origin
  const customerId = await ensureStripeCustomerId(currentUser, secretKey)

  const payload = new URLSearchParams()
  payload.set('customer', customerId)
  payload.set('return_url', resolveBillingRedirectUrl(body.returnUrl, origin, '/app/settings'))

  const session = await stripePost<{ url: string }>('/billing_portal/sessions', payload, secretKey)

  return {
    customerId,
    url: session.url,
  }
})
