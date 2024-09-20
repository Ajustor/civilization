export const prerender = false
import type { PageLoad } from './$types'
import { getMyCivilizationFromId } from '../../../services/api/civilization-api'
import { redirect } from '@sveltejs/kit'


export const load: PageLoad = async ({ parent, params }) => {
  const data = await parent()

  const civilization = await getMyCivilizationFromId(data.authToken ?? '', params.slug).catch((error) => console.error('An error occured', error))
  if (!civilization) {
    redirect(302, '/')
  }
  return {
    civilization,
  }
}