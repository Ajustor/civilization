import type { Citizen } from './citizen'
import type { ResourceType } from './resource'

export type Civilization = {
  citizens: Citizen[]
  resources: {
    type: ResourceType
    quantity: number
  }[]
  buildings: {
    type: string
    capacity?: number
  }[]
  id: string
  name: string
}