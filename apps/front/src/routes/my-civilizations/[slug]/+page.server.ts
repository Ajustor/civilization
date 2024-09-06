export const prerender = false
import type { PageServerLoad } from './$types'
import { checkLogin } from '../../../services/checkLogin'
import { getMyCivilizationFromId } from '../../../services/api/civilization-api'


export const load: PageServerLoad = async ({ cookies, url, params }) => {
  checkLogin(cookies, url)

  const civilization = await getMyCivilizationFromId(cookies, params.slug)
  return {
    civilization,
  }
}
