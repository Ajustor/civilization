import { Civilization } from '../../civilization'
import type { World } from '../../world'
import type { OccupationTypes } from './enum'

export const isCollectWork = (work: Work | UpgradedWork): work is Work =>
  'collectResources' in work

export interface BaseWork {
  canUpgrade(personAge: number): boolean
}

export interface Work extends BaseWork {
  collectedResource: number
  get occupationType(): OccupationTypes
  canRetire(personAge: number): boolean
  collectResources(world: World, civilization: Civilization): boolean
  canWork(personAge: number): boolean
}

export interface UpgradedWork extends BaseWork {
  get occupationType(): OccupationTypes
  canRetire(personAge: number): boolean
  canWork(personAge: number): boolean
}
