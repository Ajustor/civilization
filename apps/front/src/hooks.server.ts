import { redirect, type Handle } from '@sveltejs/kit'
import { getUser } from './services/api/user-api'

const unprotectedRoutes = [
  '/',
  '/login',
  '/rules',
  '/register',
  '/i-forgot',
  '/favicon.ico'
]

export const handle: Handle = async ({ event, resolve }) => {

  if (unprotectedRoutes.includes(event.url.pathname)) {
    return resolve(event)
  }

  let isLogged = true
  const user = await getUser(event.cookies).catch((error) => {
    console.error(error)
    isLogged = false
  })

  const fromUrl = `${event.url.pathname}${event.url.search}`
  if ((!user || !isLogged) && !unprotectedRoutes.includes(event.url.pathname)) {
    throw redirect(302, `/login?redirectTo=${fromUrl}`)
  }

  const response = await resolve(event)
  return response
}