import type { World } from '../../world'
import type { ProfessionTypes } from './enum'

export interface Work {
  get professionType(): ProfessionTypes
  collectResources(world: World, count: number): boolean
  canWork(citizenAge: number): boolean
}