import { Civilization } from '../..'
import type { World } from '../../world'
import type { OccupationTypes } from './enum'

export const isUpgradedWork = (work: Work | UpgradedWork): work is UpgradedWork => 'produceResources' in work

export interface Work {
  get occupationType(): OccupationTypes
  collectResources(world: World, count: number): boolean
  canWork(personAge: number): boolean
}


export interface UpgradedWork {
  get occupationType(): OccupationTypes
  produceResources(civilization: Civilization, count: number): boolean
  canWork(personAge: number): boolean
}