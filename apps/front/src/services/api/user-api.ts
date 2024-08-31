import type { Cookies } from '@sveltejs/kit'
import { client } from './client'

export async function login(username: string, password: string, cookies: Cookies) {
  const { headers, error } = await client.auth.post({ username, password })

  if (error) {
    console.error(error)
    throw new Error(`[${error.status}]: ${error.value}`)
  }

  const headersEntries = (headers?.entries as CallableFunction)()

  for (const [key, value] of headersEntries) {
    console.log(key, value)
    if (key === 'set-cookie') {
      console.log('Set cookie')
      const [valueWithKey, path, expires] = value.split('; ')
      const [key, cookieValue] = valueWithKey.split('=')
      const [, parsedPath] = path.split('=')
      console.log(
        key, cookieValue, {
        path: parsedPath,
        expires: new Date(expires),
      }
      )

      cookies.set(key.trim(), cookieValue, {
        path: parsedPath,
        expires: new Date(expires),
        secure: false,
        httpOnly: false,
      })
    }
  }

}

export async function getUser(cookies: Cookies) {
  console.log(cookies.get('auth'))
  const { data: user, error: getError } = await client.auth.get({
    headers: {
      authorization: `Bearer ${cookies.get(('auth'))}`
    }
  })

  if (getError) {
    console.error(getError)
    throw new Error(`[${getError.status}]: ${JSON.stringify(getError.value)}`)
  }

  return user
}