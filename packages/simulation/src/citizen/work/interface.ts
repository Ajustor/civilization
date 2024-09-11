import type { World } from '../../world'
import type { OccupationTypes } from './enum'

export interface Work {
  get occupationType(): OccupationTypes
  collectResources(world: World, count: number): boolean
  canWork(citizenAge: number): boolean
}