import { Citizen, CitizenEntity } from '../citizen/citizen'
import { Resource } from '../resource'
import { BuildingTypes } from './enum'

export type BuildingEntity = {
  type?: BuildingTypes
  capacity?: number
  residents?: CitizenEntity[]
  resources?: Resource[]
}

export interface Building {
  capacity?: number
  residents?: Citizen[]
  resources?: Resource[]

  getType(): BuildingTypes
}