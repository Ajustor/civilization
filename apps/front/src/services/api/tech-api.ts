import { client } from './client'

export const unlockTechnology = async (authToken: string, civilizationId: string, techId: string) => {
  const { data, error } = await client.civilizations({ civilizationId }).technologies({ techId }).post(
    {},
    { headers: { authorization: `Bearer ${authToken}` } },
  )
  if (error) {
    console.error(error)
    throw error
  }
  return data
}
