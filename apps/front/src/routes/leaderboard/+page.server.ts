export const prerender = false

import type { PageServerLoad } from './$types'
import { getLeaderboard } from '../../services/api/achievement-api'

export const load: PageServerLoad = async () => {
  const data = await getLeaderboard().catch((error) => {
    console.error('An error occured', error)
    return null
  })
  return { leaderboard: data?.leaderboard ?? [] }
}
