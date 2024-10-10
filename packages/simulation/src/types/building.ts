import type { BuildingTypes } from '../buildings/enum'
import { OccupationTypes } from '../people/work/enum'
import { ResourceTypes } from '../resource'

export type ProduceResource = { resource: ResourceTypes; amount: number }
export type ExtractedResource = { resource: ResourceTypes; probability: number }

export type BuildingType = {
  id?: string
  type?: BuildingTypes
  count: number
  capacity?: number

  outputResources?: ExtractedResource[]
}

export interface ConstructionCost {
  resource: ResourceTypes
  amount: number
}

export interface WorkerRequiredToBuild {
  occupation: OccupationTypes
  amount: number
}

export interface WorkerRequired {
  occupation: OccupationTypes
  count: number
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
  workerTypeRequired: WorkerRequired[]
}

export abstract class AbstractProductionBuilding implements ProductionBuilding {
  inputResources: ProduceResource[] = []
  outputResources: ProduceResource[] = []
  workerTypeRequired: WorkerRequired[] = []
  capacity?: number | undefined
  count: number = 0
  getType(): BuildingTypes {
    throw new Error('Method not implemented.')
  }
  formatToType(): BuildingType {
    throw new Error('Method not implemented.')
  }
  public static constructionCosts: ConstructionCost[]
  public static workerRequiredToBuild: WorkerRequiredToBuild[] = []
  public static timeToBuild: number = 2
}

export interface ExtractionBuilding extends Building {
  outputResources: ExtractedResource[]
  workerTypeRequired: WorkerRequired[]
}

export abstract class AbstractExtractionBuilding implements ExtractionBuilding {
  abstract workerTypeRequired: WorkerRequired[]
  abstract outputResources: ExtractedResource[]
  abstract capacity: number
  count: number = 1
  abstract getType(): BuildingTypes
  abstract formatToType(): BuildingType
  abstract generateOutput(possibleOutput: ResourceTypes[]): void
  public static constructionCosts: ConstructionCost[] = []
  public static workerRequiredToBuild: WorkerRequiredToBuild[] = []
  public static timeToBuild: number = 2
}
