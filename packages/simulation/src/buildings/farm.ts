import { OccupationTypes } from '../people/work/enum'
import { ResourceTypes } from '../resource'
import { AbstractProductionBuilding, WorkerRequiredToBuild, type BuildingType, type ConstructionCost, type ProduceResource } from '../types/building'
import { BuildingTypes } from './enum'

export class Farm extends AbstractProductionBuilding {
  capacity?: number | undefined

  constructor(capacity: number, public count = 0) {
    super()
    this.capacity = capacity
  }

  outputResources: ProduceResource[] = [{ amount: 25, resource: ResourceTypes.FOOD }]
  workerTypeRequired: { workerType: OccupationTypes; count: number }[] = [
    { workerType: OccupationTypes.FARMER, count: 5 }
  ]

  public static workerRequiredToBuild: WorkerRequiredToBuild[] = [
    {
      occupation: OccupationTypes.GATHERER,
      amount: 2
    }
  ]

  public static constructionCosts: ConstructionCost[] = [{
    resource: ResourceTypes.PLANK,
    amount: 10
  },
  {
    resource: ResourceTypes.STONE,
    amount: 10
  }]


  getType(): BuildingTypes {
    return BuildingTypes.FARM
  }

  formatToType(): BuildingType {
    return {
      capacity: this.capacity,
      type: this.getType(),
      count: this.count
    }
  }
}