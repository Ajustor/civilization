import type { CitizenType } from '..'
import type { BuildingType } from './building'
import type { ResourceType } from './resources'

export type CivilizationType = {
  id: string
  name: string
  livedMonths: number
  citizens: CitizenType[],
  resources: ResourceType[],
  buildings: BuildingType[]
}
