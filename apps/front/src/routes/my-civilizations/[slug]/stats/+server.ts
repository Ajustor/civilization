import { json } from '@sveltejs/kit'
import {
  getCivilizationStats,
  getCombatLogs,
  getCemetery,
} from '../../../../services/api/civilization-api.js'
import {
  getCivilizationPeopleJobsStats,
  getCivilizationPeopleRatioStats,
  getCivilizationPeopleAgePyramid,
} from '../../../../services/api/people-api.js'

import type { RequestHandler } from './$types'

export const prerender = false

// Client-refreshable snapshot of every lazily-loaded stat the page shows. The
// server `load` only runs on navigation/invalidation, and its streamed promises
// captured into local component state do not update on auto-refresh — so the
// charts, combat log and cemetery are re-fetched through this endpoint instead.
export const GET: RequestHandler = async ({ cookies, params }) => {
  const auth = cookies.get('auth') ?? ''
  const [civilization, jobs, peopleRatio, agePyramid, combatLogs, cemetery] = await Promise.all([
    getCivilizationStats(auth, params.slug),
    getCivilizationPeopleJobsStats(auth, params.slug),
    getCivilizationPeopleRatioStats(auth, params.slug),
    getCivilizationPeopleAgePyramid(auth, params.slug),
    getCombatLogs(auth, params.slug, 5, 0),
    getCemetery(auth, params.slug, 20, 0),
  ])

  return json({ civilization, jobs, peopleRatio, agePyramid, combatLogs, cemetery }, { status: 200 })
}
