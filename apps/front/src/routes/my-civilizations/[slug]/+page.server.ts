export const prerender = false
import { getMyCivilizationFromId } from '../../../services/api/civilization-api'
import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getCivilizationPeopleStats, getPeopleFromCivilizationPaginated } from '../../../services/api/people-api'


export const load: PageServerLoad = async ({ cookies, params }) => {

  const civilization = await getMyCivilizationFromId(cookies.get('auth') ?? '', params.slug).catch((error) => console.error('An error occured', error))

  if (!civilization) {
    redirect(302, '/')
  }

  return {
    civilization,
    lazy: {
      people: getPeopleFromCivilizationPaginated(cookies.get('auth') ?? '', params.slug, { page: 0, count: 10 }),
      stats: getCivilizationPeopleStats(cookies.get('auth') ?? '', params.slug)
    }
  }
}
