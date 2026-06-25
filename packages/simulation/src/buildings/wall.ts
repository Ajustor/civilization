import type { Building, BuildingType, ConstructionCost, WorkerRequiredToBuild } from '../types/building'
import { BuildingTypes } from './enum'
import { ResourceTypes } from '../resource'
import { OccupationTypes } from '../people/work/enum'

export class Wall implements Building {
  constructor(public count = 0) {}

  public static timeToBuild: number = 12
  public static minBuilders: number = 250

  public static constructionCosts: ConstructionCost[] = [
    { resource: ResourceTypes.STONE, amount: 2000 },
    { resource: ResourceTypes.WOOD, amount: 1500 },
  ]

  public static workerRequiredToBuild: WorkerRequiredToBuild[] = [
    { occupation: OccupationTypes.GATHERER, amount: 5 },
  ]

  getType(): BuildingTypes {
    return BuildingTypes.WALL
  }

  formatToType(): BuildingType {
    return {
      count: this.count,
      type: this.getType(),
    }
  }
}
