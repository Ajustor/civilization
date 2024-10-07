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