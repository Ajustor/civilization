import { Citizen, CitizenEntity } from '../citizen/citizen'
import { Resource, ResourceEntity } from '../resource'
import { BuildingTypes } from './enum'

export type BuildingEntity = {
  id?: string
  type?: BuildingTypes
  capacity?: number
  residents?: CitizenEntity[]
  resources?: ResourceEntity[]
}

export interface Building {
  capacity?: number
  residents?: Citizen[]
  resources?: Resource[]

  getType(): BuildingTypes
}