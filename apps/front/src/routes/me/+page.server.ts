import { getUser } from '../../services/api/user-api'
import { checkLogin } from '../../services/checkLogin'
import type { User } from '../../stores/user'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ cookies, url }) => {
  checkLogin(cookies, url)

  const isLogged = !!cookies.get('auth')
  let user: User | null = null
  if (isLogged) {
    try {
      user = await getUser(cookies)

    } catch (error) {
      console.error(error)
    }
  }

  return {
    user,
  }
}