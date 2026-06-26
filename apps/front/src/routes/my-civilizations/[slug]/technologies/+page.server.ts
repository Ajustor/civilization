export const prerender = false

import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getMyCivilizationFromId } from '../../../../services/api/civilization-api'

export const load: PageServerLoad = async ({ cookies, params }) => {
  const civilization = await getMyCivilizationFromId(cookies.get('auth') ?? '', params.slug).catch(
    (error) => console.error('An error occured', error),
  )
  if (!civilization) {
    redirect(302, '/my-civilizations')
  }
  return { civilization }
}
