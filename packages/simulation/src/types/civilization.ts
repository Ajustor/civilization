import type { BuildingType } from './building'
import type { PeopleType } from '..'
import type { ResourceType } from './resources'
import { BuildingTypes } from '../buildings/enum'

export type PendingConstruction = {
  buildingType: BuildingTypes
  monthsRemaining: number
}

export type CivilizationConfig = {
  PREGNANCY_PROBABILITY: number
  MAX_ACTIVE_PEOPLE_BY_CIVILIZATION: number
  PEOPLE_CHARCOAL_CAN_HEAT: number
  CHANCE_TO_EVOLVE: number
  CHANCE_TO_BUILD_EVOLVED_BUILDING: number
  MAXIMUM_CHILDREN: number
  OPEN_EXCHANGE: string[]
}


export type CivilizationType = {
  id: string
  name: string
  livedMonths: number
  people?: PeopleType[],
  resources: ResourceType[],
  buildings: BuildingType[],
  citizensCount?: number,
  config: CivilizationConfig
  pendingConstructions: PendingConstruction[]
}
