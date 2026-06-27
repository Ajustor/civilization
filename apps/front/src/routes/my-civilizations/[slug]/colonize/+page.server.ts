export const prerender = false

import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import {
  getMyCivilizationFromId,
  colonizeCivilization,
} from '../../../../services/api/civilization-api'

export const load: PageServerLoad = async ({ cookies, params }) => {
  const civilization = await getMyCivilizationFromId(
    cookies.get('auth') ?? '',
    params.slug,
  ).catch(() => null)

  if (!civilization) {
    redirect(302, '/my-civilizations')
  }

  // Guard: COLONISATION tech required (also enforced server-side in the API)
  if (!(civilization.researchedTechs ?? []).includes('colonization')) {
    redirect(302, `/my-civilizations/${params.slug}`)
  }

  return { civilization }
}

export const actions: Actions = {
  colonize: async ({ cookies, params, request }) => {
    const formData = await request.formData()
    const colonyName = ((formData.get('colonyName') as string) ?? '').trim()
    const populationPercent = Number(formData.get('populationPercent'))
    const resources = JSON.parse(
      (formData.get('resources') as string) || '[]',
    ) as { type: string; amount: number }[]
    const techs = JSON.parse(
      (formData.get('techs') as string) || '[]',
    ) as string[]

    let colonyId: string | undefined
    try {
      const result = await colonizeCivilization(cookies.get('auth') ?? '', params.slug, {
        colonyName,
        populationPercent,
        resources,
        techs,
      })
      colonyId = result && 'colonyId' in result ? result.colonyId : undefined
    } catch (err) {
      return fail(400, {
        error:
          err instanceof Error ? err.message : 'Une erreur est survenue',
      })
    }

    redirect(302, colonyId ? `/my-civilizations/${colonyId}` : '/my-civilizations')
  },
}
