import { createError } from 'h3'
import type { User } from '../generated/prisma/client'
import { prisma } from './prisma'
import { stripePost } from './stripe'

export const BILLING_PLAN_TIERS = ['FREE', 'CORE_CLARITY', 'PLANNING_SCENARIOS'] as const
export type BillingPlanTier = typeof BILLING_PLAN_TIERS[number]

export const BILLING_SUBSCRIPTION_STATUSES = [
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
  'CANCELED',
  'INACTIVE',
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'UNPAID',
  'PAUSED',
] as const
export type BillingSubscriptionStatus = typeof BILLING_SUBSCRIPTION_STATUSES[number]

export type BillingEntitlements = {
  dashboardHistoryLimit: number | null
  annualVisibilityLimitMonths: number | null
  canUseDeadlines: boolean
  canUseMonthlyLoop: boolean
  canUseAnnualPlanning: boolean
  canCompareScenarios: boolean
  canExportForAccountant: boolean
}

const BILLING_ADMIN_EMAILS = new Set([
  'valentinogoxhaj@gmail.com',
])

const PRICE_ENV_BY_PLAN: Record<Exclude<BillingPlanTier, 'FREE'>, string> = {
  CORE_CLARITY: 'STRIPE_CORE_CLARITY_PRICE_ID',
  PLANNING_SCENARIOS: 'STRIPE_PLANNING_SCENARIOS_PRICE_ID',
}

const FREE_ENTITLEMENTS: BillingEntitlements = {
  dashboardHistoryLimit: 3,
  annualVisibilityLimitMonths: 3,
  canUseDeadlines: false,
  canUseMonthlyLoop: false,
  canUseAnnualPlanning: false,
  canCompareScenarios: false,
  canExportForAccountant: false,
}

const CORE_ENTITLEMENTS: BillingEntitlements = {
  dashboardHistoryLimit: null,
  annualVisibilityLimitMonths: null,
  canUseDeadlines: true,
  canUseMonthlyLoop: true,
  canUseAnnualPlanning: true,
  canCompareScenarios: false,
  canExportForAccountant: false,
}

const PLANNING_ENTITLEMENTS: BillingEntitlements = {
  dashboardHistoryLimit: null,
  annualVisibilityLimitMonths: null,
  canUseDeadlines: true,
  canUseMonthlyLoop: true,
  canUseAnnualPlanning: true,
  canCompareScenarios: true,
  canExportForAccountant: true,
}

function isBillingAdminEmail(email: string | null | undefined) {
  return typeof email === 'string' && BILLING_ADMIN_EMAILS.has(email.trim().toLowerCase())
}

export function isBillingPlanTier(value: unknown): value is BillingPlanTier {
  return typeof value === 'string' && BILLING_PLAN_TIERS.includes(value as BillingPlanTier)
}

export function assertBillingPlanTier(value: unknown): BillingPlanTier {
  if (!isBillingPlanTier(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid billing plan.',
    })
  }

  return value
}

export function normalizeBillingPlanTier(value: unknown): BillingPlanTier {
  if (typeof value !== 'string') return 'FREE'
  const normalized = value.trim().toUpperCase()
  return isBillingPlanTier(normalized) ? normalized : 'FREE'
}

export function normalizeBillingSubscriptionStatus(value: unknown): BillingSubscriptionStatus {
  if (typeof value !== 'string') return 'INACTIVE'
  const normalized = value.trim().toUpperCase()
  return BILLING_SUBSCRIPTION_STATUSES.includes(normalized as BillingSubscriptionStatus)
    ? (normalized as BillingSubscriptionStatus)
    : 'INACTIVE'
}

export function isBillingActiveStatus(status: BillingSubscriptionStatus) {
  return status === 'ACTIVE' || status === 'TRIALING' || status === 'PAST_DUE'
}

export function getBillingEntitlements(input: Pick<User, 'planTier' | 'subscriptionStatus'> & { email?: string | null }): BillingEntitlements {
  if (isBillingAdminEmail(input.email)) {
    return { ...PLANNING_ENTITLEMENTS }
  }

  const planTier = normalizeBillingPlanTier(input.planTier)
  const subscriptionStatus = normalizeBillingSubscriptionStatus(input.subscriptionStatus)

  if (planTier === 'FREE' || !isBillingActiveStatus(subscriptionStatus)) {
    return { ...FREE_ENTITLEMENTS }
  }

  if (planTier === 'PLANNING_SCENARIOS') return { ...PLANNING_ENTITLEMENTS }
  return { ...CORE_ENTITLEMENTS }
}

export function isPaidBillingState(input: Pick<User, 'planTier' | 'subscriptionStatus'> & { email?: string | null }) {
  if (isBillingAdminEmail(input.email)) {
    return true
  }

  const planTier = normalizeBillingPlanTier(input.planTier)
  const subscriptionStatus = normalizeBillingSubscriptionStatus(input.subscriptionStatus)
  return planTier !== 'FREE' && isBillingActiveStatus(subscriptionStatus)
}

export function getBillingState(input: Pick<User, 'planTier' | 'subscriptionStatus'> & { email?: string | null }) {
  if (isBillingAdminEmail(input.email)) {
    return {
      planTier: 'PLANNING_SCENARIOS' as const,
      subscriptionStatus: 'ACTIVE' as const,
      isPaid: true,
      entitlements: { ...PLANNING_ENTITLEMENTS },
    }
  }

  const planTier = normalizeBillingPlanTier(input.planTier)
  const subscriptionStatus = normalizeBillingSubscriptionStatus(input.subscriptionStatus)

  return {
    planTier,
    subscriptionStatus,
    isPaid: planTier !== 'FREE' && isBillingActiveStatus(subscriptionStatus),
    entitlements: getBillingEntitlements({ planTier, subscriptionStatus }),
  }
}

export function getStripePriceId(planTier: Exclude<BillingPlanTier, 'FREE'>) {
  const envName = PRICE_ENV_BY_PLAN[planTier]
  const legacyEnvName = planTier === 'CORE_CLARITY'
    ? 'STRIPE_PRICE_ID_CORE_CLARITY'
    : 'STRIPE_PRICE_ID_PLANNING_SCENARIOS'
  const priceId = process.env[envName] ?? process.env[legacyEnvName]

  if (!priceId) {
    throw createError({
      statusCode: 500,
      statusMessage: `Missing ${envName}.`,
    })
  }

  return priceId
}

export function resolvePlanTierFromPriceId(priceId: string | null | undefined, fallback: BillingPlanTier = 'FREE'): BillingPlanTier {
  if (!priceId) return fallback

  const corePriceId = process.env.STRIPE_CORE_CLARITY_PRICE_ID ?? process.env.STRIPE_PRICE_ID_CORE_CLARITY
  const planningPriceId = process.env.STRIPE_PLANNING_SCENARIOS_PRICE_ID ?? process.env.STRIPE_PRICE_ID_PLANNING_SCENARIOS

  if (priceId === corePriceId) return 'CORE_CLARITY'
  if (priceId === planningPriceId) return 'PLANNING_SCENARIOS'
  return fallback
}

export function resolvePlanTierFromPriceIds(priceIds: Array<string | null | undefined>, fallback: BillingPlanTier = 'FREE') {
  for (const priceId of priceIds) {
    const resolved = resolvePlanTierFromPriceId(priceId, 'FREE')
    if (resolved !== 'FREE') return resolved
  }

  return fallback
}

export function resolveBillingRedirectUrl(input: unknown, origin: string, fallbackPath: string) {
  if (typeof input !== 'string' || !input.trim()) {
    return new URL(fallbackPath, origin).toString()
  }

  const candidate = new URL(input, origin)
  if (candidate.origin !== origin) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Redirect URLs must stay on the current origin.',
    })
  }

  return candidate.toString()
}

export async function updateUserBillingState(userId: number, data: {
  planTier?: BillingPlanTier
  subscriptionStatus?: BillingSubscriptionStatus
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.planTier ? { planTier: data.planTier } : {}),
      ...(data.subscriptionStatus ? { subscriptionStatus: data.subscriptionStatus } : {}),
      ...(data.stripeCustomerId !== undefined ? { stripeCustomerId: data.stripeCustomerId } : {}),
      ...(data.stripeSubscriptionId !== undefined ? { stripeSubscriptionId: data.stripeSubscriptionId } : {}),
    },
  })
}

export async function ensureStripeCustomerId(user: Pick<User, 'id' | 'email' | 'name' | 'picture' | 'displayName' | 'stripeCustomerId'>, secretKey: string) {
  if (user.stripeCustomerId) return user.stripeCustomerId

  const body = new URLSearchParams()
  body.set('email', user.email)
  body.set('metadata[userId]', String(user.id))
  if (user.displayName || user.name) body.set('name', user.displayName || user.name || '')
  if (user.picture) body.set('metadata[picture]', user.picture)

  const customer = await stripePost<{ id: string }>('/customers', body, secretKey)

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

export function extractStripeUserId(metadata: unknown, fallback?: string | null) {
  const value = typeof metadata === 'object' && metadata !== null
    ? (metadata as Record<string, unknown>).userId ?? (metadata as Record<string, unknown>)['user_id']
    : null

  const candidate = typeof value === 'string' ? value : fallback
  if (!candidate) return null

  const userId = Number(candidate)
  return Number.isInteger(userId) && userId > 0 ? userId : null
}
