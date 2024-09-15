import type { BuildingType } from './building'
import type { PeopleType } from '..'
import type { ResourceType } from './resources'

export type CivilizationType = {
  id: string
  name: string
  livedMonths: number
  people: PeopleType[],
  resources: ResourceType[],
  buildings: BuildingType[]
}
