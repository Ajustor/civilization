import { OccupationTypes } from '../people/work/enum'
import { ResourceTypes } from '../resource'
import {
  AbstractProductionBuilding,
  type BuildingType,
  type ConstructionCost,
  type WorkerRequired,
  type WorkerRequiredToBuild,
} from '../types/building'
import { BuildingTypes } from './enum'

export class Library extends AbstractProductionBuilding {
  constructor(public count: number) {
    super()
  }

  workerTypeRequired: WorkerRequired[] = [
    {
      occupation: OccupationTypes.ERUDIT,
      count: 2,
    },
  ]

  // Pure generator: no resource input/output. Its "output" is research points,
  // credited by Civilization.produceResearch().
  inputResources = []
  outputResources = []

  public static workerRequiredToBuild: WorkerRequiredToBuild[] = [
    {
      occupation: OccupationTypes.BUILDER,
      amount: 2,
    },
  ]

  public static timeToBuild: number = 4

  public static constructionCosts: ConstructionCost[] = [
    {
      resource: ResourceTypes.WOOD,
      amount: 15,
    },
    {
      resource: ResourceTypes.STONE,
      amount: 10,
    },
  ]

  // Research points produced per fully-staffed library per month.
  public static researchOutput: number = 2

  getType(): BuildingTypes {
    return BuildingTypes.LIBRARY
  }

  formatToType(): BuildingType {
    return {
      type: this.getType(),
      count: this.count,
    }
  }
}
