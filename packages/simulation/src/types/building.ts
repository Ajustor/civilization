import type { BuildingTypes } from '../buildings/enum'
import { OccupationTypes } from '../people/work/enum'
import { ResourceTypes } from '../resource'

export type ProduceResource = { resource: ResourceTypes, amount: number }

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

export interface ProductionBuilding extends Building {
  inputResources: ProduceResource[]
  outputResources: ProduceResource[]
}

export interface ExtractionBuilding extends Building {
  workerType: OccupationTypes
  outputResources: { resource: ResourceTypes, probability: number }[]
}