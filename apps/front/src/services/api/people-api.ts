import { client } from './client'

export const getPeopleFromCivilization = async (authToken: string, civilizationId: string) => {
  return client.people({ civilizationId }).get({
    headers: {
      authorization: `Bearer ${authToken}`
    }
  })
}