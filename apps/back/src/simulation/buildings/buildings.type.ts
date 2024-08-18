import { Citizen } from '../citizen/citizen'
import { Resource } from '../resource'
import { BuildingTypes } from './enum'

export interface Building {
  capacity?: number
  residents?: Citizen[]
  resources?: Resource[]

  getType(): BuildingTypes
}