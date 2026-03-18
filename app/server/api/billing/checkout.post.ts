import { getRequestURL, readBody } from 'h3'
import { requireStripeSecret, stripePost } from '~/server/utils/stripe'
import {
  assertBillingPlanTier,
  ensureStripeCustomerId,
  getStripePriceId,
  resolveBillingRedirectUrl,
} from '~/server/utils/billing'
import { requireAppUser } from '~/server/utils/users'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)
  const body = await readBody<{
    planTier?: string
    successUrl?: string
    cancelUrl?: string
  }>(event)

  const planTier = assertBillingPlanTier(body.planTier)
  if (planTier === 'FREE') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Choose a paid plan to start checkout.',
    })
  }

  const config = useRuntimeConfig()
  const secretKey = requireStripeSecret(config.stripeSecretKey ?? process.env.STRIPE_SECRET_KEY)
  const origin = getRequestURL(event).origin
  const customerId = await ensureStripeCustomerId(currentUser, secretKey)
  const priceId = getStripePriceId(planTier)

  const payload = new URLSearchParams()
  payload.set('mode', 'subscription')
  payload.set('customer', customerId)
  payload.set('client_reference_id', String(currentUser.id))
  payload.set('success_url', resolveBillingRedirectUrl(body.successUrl, origin, '/app?billing=success'))
  payload.set('cancel_url', resolveBillingRedirectUrl(body.cancelUrl, origin, '/pricing?billing=cancelled'))
  payload.set('line_items[0][price]', priceId)
  payload.set('line_items[0][quantity]', '1')
  payload.set('metadata[userId]', String(currentUser.id))
  payload.set('metadata[planTier]', planTier)
  payload.set('subscription_data[metadata][userId]', String(currentUser.id))
  payload.set('subscription_data[metadata][planTier]', planTier)

  const session = await stripePost<{ id: string; url: string | null }>('/checkout/sessions', payload, secretKey)

  return {
    planTier,
    customerId,
    id: session.id,
    url: session.url,
  }
})
