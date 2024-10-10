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

export class Farm extends AbstractProductionBuilding {
  constructor(public count = 0) {
    super()
  }

  outputResources: ProduceResource[] = [
    { amount: 25, resource: ResourceTypes.FOOD },
  ]
  workerTypeRequired: WorkerRequired[] = [
    { occupation: OccupationTypes.FARMER, count: 5 },
  ]

  public static workerRequiredToBuild: WorkerRequiredToBuild[] = [
    {
      occupation: OccupationTypes.GATHERER,
      amount: 2,
    },
  ]

  public static constructionCosts: ConstructionCost[] = [
    {
      resource: ResourceTypes.PLANK,
      amount: 10,
    },
    {
      resource: ResourceTypes.STONE,
      amount: 10,
    },
  ]

  getType(): BuildingTypes {
    return BuildingTypes.FARM
  }

  formatToType(): BuildingType {
    return {
      type: this.getType(),
      count: this.count,
    }
  }
}

