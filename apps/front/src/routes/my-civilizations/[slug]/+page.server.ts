export const prerender = false

import {
  getCivilizationStats,
  getMyCivilizationFromId,
  getCivilizationWorld,
  getCombatLogs,
  updateCivilization,
  getMyCivilizations,
} from '../../../services/api/civilization-api'
import { getWorldCivilizations } from '../../../services/api/world-api'
import { fail, error, redirect } from '@sveltejs/kit'
import { message, superValidate } from 'sveltekit-superforms'
import { zod4 as zod } from 'sveltekit-superforms/adapters'
import { warConfigSchema } from '$lib/schemas/warConfig'
import type { Actions, PageServerLoad } from './$types'
import {
  getPeopleFromCivilizationPaginated,
  getCivilizationPeopleJobsStats,
  getCivilizationPeopleRatioStats,
  getCivilizationBuilders,
} from '../../../services/api/people-api'
import type { CivilizationType } from '@ajustor/simulation'

export const load: PageServerLoad = async ({ cookies, params }) => {
  const auth = cookies.get('auth') ?? ''

  const civilization = await getMyCivilizationFromId(
    auth,
    params.slug,
  ).catch((error) => console.error('An error occured', error))

  if (!civilization) {
    redirect(302, '/')
  }

  const [myCivilizations, worldId] = await Promise.all([
    getMyCivilizations(auth).catch(() => [] as Awaited<ReturnType<typeof getMyCivilizations>>),
    getCivilizationWorld(auth, params.slug).catch(() => null),
  ])

  // Guerre : toutes les civilisations du monde sauf les siennes
  const myIds = new Set((myCivilizations as CivilizationType[]).map((c) => c.id))
  const worldCivilizations = worldId
    ? (await getWorldCivilizations(worldId).catch(() => [])).filter((c) => !myIds.has(c.id))
    : []

  const warForm = await superValidate(
    { atWarWith: civilization.config.AT_WAR_WITH ?? [] },
    zod(warConfigSchema),
  )

  return {
    civilization,
    worldId,
    worldCivilizations,
    warForm,
    lazy: {
      people: getPeopleFromCivilizationPaginated(auth, params.slug, {
        page: 0,
        count: 10,
      }),
      stats: {
        jobs: getCivilizationPeopleJobsStats(auth, params.slug),
        peopleRatio: getCivilizationPeopleRatioStats(auth, params.slug),
        civilization: getCivilizationStats(auth, params.slug),
      },
      combatLogs: getCombatLogs(auth, params.slug, 5, 0),
      // Citizens currently on a construction site (who builds what).
      builders: getCivilizationBuilders(auth, params.slug).catch(() => []),
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

  updateWar: async ({ cookies, params, ...event }) => {
    const form = await superValidate({ cookies, params, ...event }, zod(warConfigSchema))
    if (!form.valid) {
      return fail(400, { form })
    }
    try {
      await updateCivilization(cookies.get('auth') ?? '', params.slug, {
        atWarWith: form.data.atWarWith,
      })
      return { form: message(form, { status: 'success', text: 'Cibles de guerre mises à jour' }) }
    } catch (requestError) {
      error(
        (requestError as { status?: number }).status ?? 500,
        (requestError as { value?: string }).value ?? 'Une erreur est survenue',
      )
    }
  },
} satisfies Actions
