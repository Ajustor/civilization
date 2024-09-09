import type { World } from '../../world'
import type { OccupationType } from './enum'

export interface Work {
  get occupationType(): OccupationType
  collectResources(world: World, count: number): boolean
  canWork(citizenAge: number): boolean
}