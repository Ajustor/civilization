import { OccupationTypes } from '../people/work/enum'
import { ResourceTypes } from '../resource'
import {
  AbstractProductionBuilding,
  BuildingType,
  ConstructionCost,
  WorkerRequired,
} from '../types/building'
import { BuildingTypes } from './enum'

export class Sawmill extends AbstractProductionBuilding {
  constructor(public count: number) {
    super()
  }
  workerTypeRequired: WorkerRequired[] = [
    {
      occupation: OccupationTypes.CARPENTER,
      count: 2,
    },
  ]

  inputResources = [
    {
      resource: ResourceTypes.WOOD,
      amount: 1,
    },
  ]

  outputResources = [
    {
      resource: ResourceTypes.PLANK,
      amount: 5,
    },
  ]

  public static timeToBuild: number = 4

  public static constructionCosts: ConstructionCost[] = [
    {
      resource: ResourceTypes.STONE,
      amount: 15,
    },
  ]

  getType(): BuildingTypes {
    return BuildingTypes.SAWMILL
  }

  formatToType(): BuildingType {
    return {
      type: this.getType(),
      count: this.count,
    }
  }
}
