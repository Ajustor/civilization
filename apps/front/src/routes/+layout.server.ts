export const prerender = false

import { getUser } from '../services/api/user-api'
import { type User } from '../stores/user'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ cookies, url }) => {
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
    url: url.pathname,
    isLogged,
    user,
    authToken: cookies.get('auth')
  }
}