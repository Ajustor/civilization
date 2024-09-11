import { Resource, ResourceTypes } from './resource'

import { Citizen } from './citizen/citizen'
import type { CitizenEntity } from './types/citizen'
import { Civilization } from './civilization'
import type { ResourceType } from './types/resources'
import { World } from './world'

export type { CivilizationType } from './types/civilization'
export type { BuildingType } from './types/building'

export { BuildingTypes } from './buildings/enum'
export { House } from './buildings/house'

export { OccupationTypes } from './citizen/work/enum'
export { Gender } from './citizen/enum'
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