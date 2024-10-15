import { client } from './client'

export const getPeopleFromCivilization = async (authToken: string, civilizationId: string) => {
  const { data: people, error } = await client.people({ civilizationId }).get({
    headers: {
      authorization: `Bearer ${authToken}`
    }
  })

  if (error) {
    throw error
  }

  return people
}

export const getCivilizationPeopleStats = async (authToken: string, civilizationId: string) => {
  const { data: stats, error } = await client.people({ civilizationId }).stats.get({
    headers: {
      authorization: `Bearer ${authToken}`
    }
  })

  if (error) {
    throw error
  }

  return stats
}