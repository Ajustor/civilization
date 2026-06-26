import { client } from './client'

export const getCivilizationRecap = async (authToken: string, civilizationId: string) => {
  const { data, error } = await client.civilizations({ civilizationId }).recap.get({
    headers: {
      authorization: `Bearer ${authToken}`,
    },
  })

  if (error) {
    console.error(error)
    throw error
  }

  return data
}
