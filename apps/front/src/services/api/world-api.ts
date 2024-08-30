import { client } from './client'

export async function getWorldsInfos() {
  const { data: worldInfos, error } = await client.worlds.get()

  if (error) {
    console.error(error)
    throw new Error(`[${error.status}]: ${error.value}`)
  }

  return worldInfos
}