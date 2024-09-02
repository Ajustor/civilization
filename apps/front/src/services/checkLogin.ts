import { redirect, type Cookies } from '@sveltejs/kit'

export const checkLogin = (cookies: Cookies, url: URL) => {
  const isLogged = !!cookies.get('auth')

  if (!isLogged) {
    const fromUrl = `${url.pathname}${url.search}`
    throw redirect(302, `/login?redirectTo=${fromUrl}`)
  }
}