import type { BuildingTypes } from '../buildings/enum'
import { ResourceTypes } from '../resource'

export type BuildingType = {
  id?: string
  type?: BuildingTypes
  capacity?: number
  count: number
}

export interface ConstructionCost {
  resource: ResourceTypes
  amount: number
}

export interface Building {
  capacity?: number
  count: number

  getType(): BuildingTypes
  formatToType(): BuildingType
}