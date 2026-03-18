import { getHeader, readRawBody } from 'h3'
import { prisma } from '~/server/utils/prisma'
import {
  extractStripeUserId,
  normalizeBillingPlanTier,
  normalizeBillingSubscriptionStatus,
  resolvePlanTierFromPriceIds,
  updateUserBillingState,
} from '~/server/utils/billing'
import { requireStripeSecret, verifyStripeWebhookSignature } from '~/server/utils/stripe'

type StripeCheckoutSession = {
  id: string
  customer?: string | null
  subscription?: string | null
  client_reference_id?: string | null
  metadata?: Record<string, string | undefined>
  payment_status?: string | null
}

type StripeSubscription = {
  id: string
  customer?: string | null
  status?: string | null
  metadata?: Record<string, string | undefined>
  items?: {
    data?: Array<{
      price?: { id?: string | null } | null
    }>
  }
}

type StripeInvoice = {
  subscription?: string | null
  customer?: string | null
}

type StripeWebhookEvent = {
  id: string
  type: string
  data: {
    object: StripeCheckoutSession | StripeSubscription | StripeInvoice | Record<string, unknown>
  }
}

function getUserIdFromPayload(payload: StripeCheckoutSession | StripeSubscription | StripeInvoice | Record<string, unknown>) {
  const metadata = 'metadata' in payload ? payload.metadata : undefined
  const referenceId = 'client_reference_id' in payload ? payload.client_reference_id : null
  return extractStripeUserId(metadata, referenceId)
}

async function findUserByStripeReferences(input: {
  userId?: number | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}) {
  if (input.userId) {
    return prisma.user.findUnique({ where: { id: input.userId } })
  }

  if (input.stripeSubscriptionId) {
    const bySubscription = await prisma.user.findFirst({
      where: { stripeSubscriptionId: input.stripeSubscriptionId },
    })
    if (bySubscription) return bySubscription
  }

  if (input.stripeCustomerId) {
    const byCustomer = await prisma.user.findFirst({
      where: { stripeCustomerId: input.stripeCustomerId },
    })
    if (byCustomer) return byCustomer
  }

  return null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const webhookSecret = requireStripeSecret(config.stripeWebhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET)
  const payload = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')

  if (!payload) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing Stripe webhook payload.',
    })
  }

  verifyStripeWebhookSignature(payload, signature, webhookSecret)

  const stripeEvent = JSON.parse(payload) as StripeWebhookEvent
  const object = stripeEvent.data.object

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = object as StripeCheckoutSession
    const userId = getUserIdFromPayload(session)
    if (!userId) return { received: true, ignored: true }

    await updateUserBillingState(userId, {
      planTier: normalizeBillingPlanTier(session.metadata?.planTier),
      subscriptionStatus: normalizeBillingSubscriptionStatus(session.payment_status === 'paid' ? 'active' : 'incomplete'),
      stripeCustomerId: session.customer ?? undefined,
      stripeSubscriptionId: session.subscription ?? undefined,
    })

    return { received: true }
  }

  if (stripeEvent.type === 'customer.subscription.created' || stripeEvent.type === 'customer.subscription.updated') {
    const subscription = object as StripeSubscription
    const priceIds = subscription.items?.data?.map(item => item.price?.id ?? null) ?? []
    const userId = getUserIdFromPayload(subscription)
      ?? await findUserByStripeReferences({
        stripeCustomerId: subscription.customer ?? null,
        stripeSubscriptionId: subscription.id,
      }).then(user => user?.id ?? null)

    if (!userId) return { received: true, ignored: true }

    await updateUserBillingState(userId, {
      planTier: resolvePlanTierFromPriceIds(priceIds, normalizeBillingPlanTier(subscription.metadata?.planTier)),
      subscriptionStatus: normalizeBillingSubscriptionStatus(subscription.status),
      stripeCustomerId: subscription.customer ?? undefined,
      stripeSubscriptionId: subscription.id,
    })

    return { received: true }
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const subscription = object as StripeSubscription
    const userId = getUserIdFromPayload(subscription)
      ?? await findUserByStripeReferences({
        stripeCustomerId: subscription.customer ?? null,
        stripeSubscriptionId: subscription.id,
      }).then(user => user?.id ?? null)

    if (!userId) return { received: true, ignored: true }

    await updateUserBillingState(userId, {
      planTier: 'FREE',
      subscriptionStatus: 'CANCELED',
      stripeSubscriptionId: null,
    })

    return { received: true }
  }

  if (stripeEvent.type === 'invoice.payment_succeeded' || stripeEvent.type === 'invoice.payment_failed') {
    const invoice = object as StripeInvoice
    const user = await findUserByStripeReferences({
      stripeCustomerId: invoice.customer ?? null,
      stripeSubscriptionId: invoice.subscription ?? null,
    })

    if (!user) return { received: true, ignored: true }

    await updateUserBillingState(user.id, {
      subscriptionStatus: stripeEvent.type === 'invoice.payment_succeeded' ? 'ACTIVE' : 'PAST_DUE',
    })

    return { received: true }
  }

  return { received: true, ignored: true }
})
