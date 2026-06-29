export const prerender = false

import {
  getCivilizationStats,
  getMyCivilizationFromId,
  getCivilizationWorld,
  getCombatLogs,
  updateCivilization,
} from '../../../services/api/civilization-api'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import {
  getPeopleFromCivilizationPaginated,
  getCivilizationPeopleJobsStats,
  getCivilizationPeopleRatioStats,
  getCivilizationBuilders,
} from '../../../services/api/people-api'

export const load: PageServerLoad = async ({ cookies, params }) => {
  const civilization = await getMyCivilizationFromId(
    cookies.get('auth') ?? '',
    params.slug,
  ).catch((error) => console.error('An error occured', error))

  if (!civilization) {
    redirect(302, '/')
  }

  const worldId = await getCivilizationWorld(
    cookies.get('auth') ?? '',
    params.slug,
  ).catch(() => null)

  return {
    civilization,
    worldId,
    lazy: {
      people: getPeopleFromCivilizationPaginated(cookies.get('auth') ?? '', params.slug, {
        page: 0,
        count: 10,
      }),
      stats: {
        jobs: getCivilizationPeopleJobsStats(cookies.get('auth') ?? '', params.slug),
        peopleRatio: getCivilizationPeopleRatioStats(cookies.get('auth') ?? '', params.slug),
        civilization: getCivilizationStats(cookies.get('auth') ?? '', params.slug),
      },
      combatLogs: getCombatLogs(cookies.get('auth') ?? '', params.slug, 5, 0),
      // Citizens currently on a construction site (who builds what).
      builders: getCivilizationBuilders(cookies.get('auth') ?? '', params.slug).catch(() => []),
    },
  }
}

export const actions: Actions = {
  // Choix du prochain bâtiment à construire, déplacé depuis la page de
  // configuration vers le bloc « Constructions en cours » de la civilisation.
  updateNextBuilding: async ({ cookies, params, request }) => {
    const formData = await request.formData()
    const raw = formData.get('nextBuildingToBuild')
    const nextBuildingToBuild = raw ? String(raw) : null

    try {
      await updateCivilization(cookies.get('auth') ?? '', params.slug, {
        nextBuildingToBuild,
      })
      return { success: true }
    } catch (requestError) {
      return fail(requestError?.status ?? 500, {
        message: requestError?.value ?? 'Une erreur est survenue',
      })
    }
  },
} satisfies Actions
