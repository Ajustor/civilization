export const prerender = false

/** @type {import('@sveltejs/adapter-vercel').Config} */export const config = { runtime: 'nodejs20.x' }

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
      console.error('An error occured in the layout', ...error)
    }
  }

  return {
    url: url.pathname,
    isLogged,
    user,
    authToken: cookies.get('auth')
  }
}
