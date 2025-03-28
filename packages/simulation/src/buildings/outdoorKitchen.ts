import { OccupationTypes } from '../people/work/enum'
import { ResourceTypes } from '../resource'
import {
  AbstractUpgradedProductionBuilding,
  NeededBuildingToUpgrade,
  WorkerRequired,
  WorkerRequiredToBuild,
  type BuildingType,
  type ConstructionCost,
  type ProduceResource,
} from '../types/building'
import { BuildingTypes } from './enum'

export class OutdoorKitchen extends AbstractUpgradedProductionBuilding {
  constructor(public count = 0) {
    super()
  }

  inputResources = [
    {
      resource: ResourceTypes.RAW_FOOD,
      amount: 20,
    },
  ]

  outputResources: ProduceResource[] = [
    { amount: 20, resource: ResourceTypes.COOKED_FOOD },
  ]

  workerTypeRequired: WorkerRequired[] = [
    { occupation: OccupationTypes.COOK, count: 2 },
  ]

  public static workerRequiredToBuild: WorkerRequiredToBuild[] = [
    {
      occupation: OccupationTypes.GATHERER,
      amount: 2,
    },
    {
      occupation: OccupationTypes.CARPENTER,
      amount: 1,
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

  public static neededBuildingToUpgrade: NeededBuildingToUpgrade[] = [
    {
      building: BuildingTypes.CAMPFIRE,
      quantity: 2,
    },
  ]

  getType(): BuildingTypes {
    return BuildingTypes.OUTDOOR_KITCHEN
  }

  formatToType(): BuildingType {
    return {
      type: this.getType(),
      count: this.count,
    }
  }
}
