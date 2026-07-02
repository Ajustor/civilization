export const prerender = false

import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getMyCivilizationFromId } from '../../../../services/api/civilization-api'
import { getCivilizationAchievements } from '../../../../services/api/achievement-api'

type UnlockedAchievement = {
  achievementId: string
  month: number | null
  unlockedAt: string | Date | null
}

export const load: PageServerLoad = async ({ cookies, params }) => {
  const authToken = cookies.get('auth') ?? ''
  const civilization = await getMyCivilizationFromId(authToken, params.slug).catch(
    (error) => console.error('An error occured', error),
  )
  if (!civilization) {
    redirect(302, '/my-civilizations')
  }
  const unlocked = await getCivilizationAchievements(authToken, params.slug).catch(
    (error) => {
      console.error('An error occured', error)
      return null
    },
  )
  const hasPayload = unlocked !== null && typeof unlocked === 'object' && 'achievements' in unlocked
  return {
    civilization,
    score: hasPayload ? ((unlocked as { score: number }).score ?? 0) : 0,
    unlockedAchievements: hasPayload
      ? ((unlocked as { achievements: UnlockedAchievement[] }).achievements ?? [])
      : ([] as UnlockedAchievement[]),
  }
}
