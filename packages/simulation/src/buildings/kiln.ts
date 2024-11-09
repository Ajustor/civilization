import { OccupationTypes } from '../people/work/enum'
import { ResourceTypes } from '../resource'
import {
  AbstractProductionBuilding,
  BuildingType,
  ConstructionCost,
  WorkerRequired,
  WorkerRequiredToBuild,
} from '../types/building'
import { BuildingTypes } from './enum'

export class Kiln extends AbstractProductionBuilding {
  constructor(public count: number) {
    super()
  }
  workerTypeRequired: WorkerRequired[] = [
    {
      occupation: OccupationTypes.CHARCOAL_BURNER,
      count: 2,
    },
  ]

  inputResources = [
    {
      resource: ResourceTypes.WOOD,
      amount: 5,
    },
  ]

  outputResources = [
    {
      resource: ResourceTypes.CHARCOAL,
      amount: 10,
    },
  ]

  public static workerRequiredToBuild: WorkerRequiredToBuild[] = [
    {
      occupation: OccupationTypes.WOODCUTTER,
      amount: 2,
    },
  ]

  public static timeToBuild: number = 4

  public static constructionCosts: ConstructionCost[] = [
    {
      resource: ResourceTypes.STONE,
      amount: 20,
    },
  ]

  getType(): BuildingTypes {
    return BuildingTypes.KILN
  }

  formatToType(): BuildingType {
    return {
      type: this.getType(),
      count: this.count,
    }
  }
}
