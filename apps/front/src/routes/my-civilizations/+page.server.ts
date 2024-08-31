export const prerender = false
import { getMyCivilizations } from '../../services/api/civilization-api'
import type { PageServerLoad } from './$types'


export const load: PageServerLoad = async ({ cookies }) => {
  const myCivilizations = await getMyCivilizations(cookies)
  return {
    myCivilizations,
  }
}

