import type { Cookies } from '@sveltejs/kit'
import { client } from './client'

export const getMyCivilizations = async (cookies: Cookies) => {
  const { data: civilizationsInfos, error } = await client.civilizations.mine.get({
    headers: {
      authorization: `Bearer ${cookies.get(('auth'))}`
    }
  })

  if (error) {
    console.error(error)
    throw new Error(`[${error.status}]: ${error.value}`)
  }

  return civilizationsInfos.civilizations
}

export const createCivilization = async (cookies: Cookies, civilizationName: string) => {
  const { error } = await client.civilizations.post({ name: civilizationName },
    {
      headers: {
        authorization: `Bearer ${cookies.get(('auth'))}`
      }
    }
  )

  if (error) {
    console.error(error)
    throw new Error(`[${error.status}]: ${error.value}`)
  }
}