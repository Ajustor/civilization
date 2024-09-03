import type { Cookies } from '@sveltejs/kit'
import { client } from './client'

export async function login(username: string, password: string, cookies: Cookies) {
  const { headers, error } = await client.auth.post({ username, password })

  if (error) {
    console.error(error)
    throw error
  }

  const headersEntries = (headers?.entries as CallableFunction)()

  for (const [key, value] of headersEntries) {
    if (key === 'set-cookie') {
      const [valueWithKey, path, expires] = value.split('; ')
      const [key, cookieValue] = valueWithKey.split('=')
      const [, parsedPath] = path.split('=')

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
  const { data: user, error } = await client.auth.get({
    headers: {
      authorization: `Bearer ${cookies.get(('auth'))}`
    }
  })

  if (error) {
    console.error(error)
    throw error
  }

  return user
}

export async function forgotPasswordUpdate(userId: string, newPassword: string, authorizationKey: string) {
  const { error } = await client.users['i-forgot'].post({ userId, password: newPassword, authorizationKey })

  if (error) {
    console.error(error)
    throw error
  }
}

export async function askPasswordLink(email: string) {
  const { error } = await client.auth['i-forgot'].get({ query: { email } })

  if (error) {
    console.error(error)
    throw error
  }
}