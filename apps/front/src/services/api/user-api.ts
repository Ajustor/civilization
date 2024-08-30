import { client } from './client'

export async function login(username: string, password: string) {
  const { error } = await client.auth.post({ username, password })

  if (error) {
    console.error(error)
    throw new Error(`[${error.status}]: ${error.value}`)
  }

  const { data: user, error: getError } = await client.auth.get()

  if (getError) {
    console.error(getError)
    throw new Error(`[${getError.status}]: ${getError.value}`)
  }

  return user
}