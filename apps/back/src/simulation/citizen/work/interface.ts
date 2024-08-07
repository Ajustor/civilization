import type { World } from '../../world'
import type { ProfessionType } from './enum'

export interface Work {
  get professionType(): ProfessionType
  collectResources(world: World, count: number): boolean
  canWork(citizenAge: number): boolean
}