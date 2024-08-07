import { client } from './client'

export function getWorldInfos() {
  return client.world.get()
}