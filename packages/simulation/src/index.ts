import { World } from './world'
import { Civilization } from './civilization'
import { Citizen } from './citizen/citizen'
import { Resource, ResourceTypes } from './resource'
import type { CitizenEntity } from './types/citizen'
import type { ResourceType } from './types/resources'
export type { CivilizationType } from './types/civilization'
export type { BuildingType } from './types/building'

export { BuildingTypes } from './buildings/enum'
export { House } from './buildings/house'

export { ProfessionTypes as ProfessionType } from './citizen/work/enum'
export { Carpenter } from './citizen/work/carpenter'
export { Farmer } from './citizen/work/farmer'
export type { Work } from './citizen/work/interface'

export * from './builders'
export * from './formatters'

type CitizenType = CitizenEntity & {
  years: number
}
type CivilizationEntity = typeof Civilization

export { World, Civilization, Citizen, Resource, ResourceTypes }
export type { CivilizationEntity, CitizenType, ResourceType, CitizenEntity }