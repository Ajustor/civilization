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
    throw error
  }

  return civilizationsInfos.civilizations
}

export const getMyCivilizationFromId = async (cookies: Cookies, civilizationId: string) => {
  const { data: civilizationInfos, error } = await client.civilizations({ civilizationId }).get({
    headers: {
      authorization: `Bearer ${cookies.get(('auth'))}`
    }
  })

  if (error) {
    console.error(error)
    throw error
  }

  return civilizationInfos.civilization
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
    throw error
  }
}

export const deleteCivilization = async (cookies: Cookies, civilizationId: string) => {
  const { error } = await client.civilizations({ civilizationId }).delete({},
    {
      headers: {
        authorization: `Bearer ${cookies.get(('auth'))}`
      }
    }
  )

  if (error) {
    console.error(error)
    throw error
  }
}