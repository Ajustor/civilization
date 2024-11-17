import { OccupationTypes } from '../people/work/enum'
import { ResourceTypes } from '../resource'
import {
  AbstractStorageBuilding,
  BuildingType,
  ConstructionCost,
  StoredResource,
  WorkerRequiredToBuild,
} from '../types/building'
import { BuildingTypes } from './enum'

export class Cache extends AbstractStorageBuilding {
  count = 1
  storedResources: StoredResource[] = [
    {
      resource: ResourceTypes.WOOD,
      maxQuantity: 150,
    },
    {
      resource: ResourceTypes.RAW_FOOD,
      maxQuantity: 300,
    },
    {
      resource: ResourceTypes.COOKED_FOOD,
      maxQuantity: 100,
    },
    {
      resource: ResourceTypes.CHARCOAL,
      maxQuantity: 150,
    },
    {
      resource: ResourceTypes.PLANK,
      maxQuantity: 150,
    },
    {
      resource: ResourceTypes.STONE,
      maxQuantity: 300,
    },
  ]

  public static constructionCosts: ConstructionCost[] = []

  public static workerRequiredToBuild: WorkerRequiredToBuild[] = [
    {
      occupation: OccupationTypes.GATHERER,
      amount: 1,
    },
  ]

  getType(): BuildingTypes {
    return BuildingTypes.CACHE
  }

  formatToType(): BuildingType {
    return {
      count: this.count,
      type: this.getType(),
    }
  }
}
