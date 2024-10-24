import type { World } from '../../world'
import type { OccupationTypes } from './enum'

export interface Work {
  get occupationType(): OccupationTypes
  canRetire(personAge: number): boolean
  collectResources(world: World, count: number): boolean
  canWork(personAge: number): boolean
}