import { json } from '@sveltejs/kit'
import {
  getCivilizationStats,
  getCombatLogs,
} from '../../../../services/api/civilization-api.js'
import {
  getCivilizationPeopleJobsStats,
  getCivilizationPeopleRatioStats,
} from '../../../../services/api/people-api.js'

export const prerender = false

// Client-refreshable snapshot of every lazily-loaded stat the page shows. The
// server `load` only runs on navigation/invalidation, and its streamed promises
// captured into local component state do not update on auto-refresh — so the
// charts and combat log are re-fetched through this endpoint instead.
export async function GET({ cookies, params }) {
  const auth = cookies.get('auth') ?? ''
  const [civilization, jobs, peopleRatio, combatLogs] = await Promise.all([
    getCivilizationStats(auth, params.slug),
    getCivilizationPeopleJobsStats(auth, params.slug),
    getCivilizationPeopleRatioStats(auth, params.slug),
    getCombatLogs(auth, params.slug, 5, 0),
  ])

  return json({ civilization, jobs, peopleRatio, combatLogs }, { status: 200 })
}
