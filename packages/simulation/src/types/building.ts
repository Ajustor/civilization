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

export interface WorkerRequiredToBuild {
  occupation: OccupationTypes
  amount: number
}

export interface Building {
  capacity?: number
  count: number

  getType(): BuildingTypes
  formatToType(): BuildingType
}

export interface ProductionBuilding extends Building {
  constructionCosts: ConstructionCost[]
  inputResources: ProduceResource[]
  outputResources: ProduceResource[]
  workerTypeRequired: { workerType: OccupationTypes, count: number }[]
}

export abstract class AbstractProductionBuilding implements ProductionBuilding {
  constructionCosts: ConstructionCost[] = []
  inputResources: ProduceResource[] = []
  outputResources: ProduceResource[] = []
  workerTypeRequired: { workerType: OccupationTypes; count: number }[] = []
  capacity?: number | undefined
  count: number = 0
  getType(): BuildingTypes {
    throw new Error('Method not implemented.')
  }
  formatToType(): BuildingType {
    throw new Error('Method not implemented.')
  }
  public static constructionCosts: ConstructionCost[]
  public static workerRequiredToBuild: WorkerRequiredToBuild[]
  public static timeToBuild: number = 2
}

export interface ExtractionBuilding extends Building {
  workerType: OccupationTypes
  outputResources: { resource: ResourceTypes, probability: number }[]
}