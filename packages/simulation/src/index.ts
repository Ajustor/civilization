import { Resource, ResourceTypes } from './resource'

import { Civilization, isExtractionBuilding } from './civilization'
import { People } from './people/people'
import type { PeopleEntity } from './types/people'
import type { ResourceType } from './types/resources'
import { World } from './world'

export type { CivilizationType, CivilizationConfig } from './types/civilization'
export type { BuildingType } from './types/building'
export type { CombatRecord, PlunderedResource } from './types/combat'
export { defaultCivilizationConfig } from './civilization'

export { BuildingTypes } from './buildings/enum'
export * from './buildings'

export { TECH_TREE, TechId, getTechNode, getBuildingGate } from './technology/techTree'
export type { TechNode, TechEffect } from './technology/techTree'

export { splitCivilization } from './colonize'
export type { SplitParams, SplitResult, ResourceTransfer } from './colonize'

export { OccupationTypes } from './people/work/enum'
export { MINIMAL_AGE_TO_BECOME } from './people/work/ages'
export { DeathCause } from './people/death'
export type { DeathRecord } from './people/death'
export { Gender } from './people/enum'
export { Carpenter } from './people/work/carpenter'
export { Farmer } from './people/work/farmer'
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

export { World, Civilization, People, Resource, ResourceTypes, isExtractionBuilding }
export type { CivilizationEntity, PeopleType, ResourceType, PeopleEntity }
export type { WorldInfos, WorldConfig } from './world'
