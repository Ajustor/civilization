import { OccupationTypes } from '../people/work/enum'
import { ResourceTypes } from '../resource'
import {
  AbstractProductionBuilding,
  WorkerRequired,
  WorkerRequiredToBuild,
  type BuildingType,
  type ConstructionCost,
  type ProduceResource,
} from '../types/building'
import { BuildingTypes } from './enum'

export class Campfire extends AbstractProductionBuilding {
  constructor(public count = 0) {
    super()
  }

  inputResources = [
    {
      resource: ResourceTypes.RAW_FOOD,
      amount: 10,
    },
  ]

  outputResources: ProduceResource[] = [
    { amount: 7, resource: ResourceTypes.COOKED_FOOD },
  ]

  workerTypeRequired: WorkerRequired[] = [
    { occupation: OccupationTypes.GATHERER, count: 1 },
  ]

  public static workerRequiredToBuild: WorkerRequiredToBuild[] = [
    {
      occupation: OccupationTypes.GATHERER,
      amount: 2,
    },
  ]

  public static constructionCosts: ConstructionCost[] = [
    {
      resource: ResourceTypes.WOOD,
      amount: 15,
    },
  ]

  getType(): BuildingTypes {
    return BuildingTypes.CAMPFIRE
  }

  formatToType(): BuildingType {
    return {
      capacity: 0,
      type: this.getType(),
      count: this.count,
    }
  }
}
