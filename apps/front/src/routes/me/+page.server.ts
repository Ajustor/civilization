import { checkLogin } from '../../services/checkLogin'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ cookies, url }) => {
  checkLogin(cookies, url)

  return {
  }
}