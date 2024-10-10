import type { World } from '../../world'
import type { OccupationTypes } from './enum'

export interface Work {
  get occupationType(): OccupationTypes
  isRetired(personAge: number): boolean
  collectResources(world: World, count: number): boolean
  canWork(personAge: number): boolean
}