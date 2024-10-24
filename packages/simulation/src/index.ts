import { Resource, ResourceTypes } from './resource'

import { Civilization } from './civilization'
import { People } from './people/people'
import type { PeopleEntity } from './types/people'
import type { ResourceType } from './types/resources'
import { World } from './world'

export type { CivilizationType } from './types/civilization'
export type { BuildingType } from './types/building'

export { BuildingTypes } from './buildings/enum'
export { House } from './buildings/house'

export { OccupationTypes } from './people/work/enum'
export { Gender } from './people/enum'
export { Carpenter, CARPENTER_REQUIRED_AGE } from './people/work/carpenter'
export { Farmer, FARMER_REQUIRED_AGE } from './people/work/farmer'
export type { Work } from './people/work/interface'
export * from './constants'
export * from './events'
export * from './builders'
export * from './formatters'

type PeopleType = PeopleEntity & {
  id: string,
  years: number
}

type CivilizationEntity = typeof Civilization

export { World, Civilization, People, Resource, ResourceTypes }
export type { CivilizationEntity, PeopleType, ResourceType, PeopleEntity }