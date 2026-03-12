import { getSettings } from '~/server/utils/taxes'
import { requireAppUser } from '~/server/utils/users'

export default defineEventHandler(async (event) => {
  const currentUser = await requireAppUser(event)
  const settings = await getSettings(currentUser.id)

  return {
    id: currentUser.id,
    email: currentUser.email,
    name: currentUser.name,
    picture: currentUser.picture,
    displayName: currentUser.displayName,
    activityLabel: currentUser.activityLabel,
    atecoCode: currentUser.atecoCode,
    atecoLabel: currentUser.atecoLabel,
    taxYear: currentUser.taxYear,
    startupRate: currentUser.startupRate,
    planTier: currentUser.planTier,
    subscriptionStatus: currentUser.subscriptionStatus,
    onboardingCompleted: Boolean(currentUser.onboardingCompletedAt),
    onboardingCompletedAt: currentUser.onboardingCompletedAt,
    settings: {
      hourlyRate: settings.hourlyRate,
      coefficiente: settings.coefficiente,
      irpefRate: settings.irpefRate,
      inpsType: settings.inpsType,
      inpsRate: settings.inpsRate,
      inpsFixedAnnual: settings.inpsFixedAnnual,
      inpsMinimaleThreshold: settings.inpsMinimaleThreshold,
      inpsExcessRate: settings.inpsExcessRate,
      accountantAnnual: settings.accountantAnnual,
    },
  }
})
