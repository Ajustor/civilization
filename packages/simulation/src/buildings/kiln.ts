import { OccupationTypes } from '..'
import { ResourceTypes } from '../resource'
import { AbstractProductionBuilding, BuildingType, ConstructionCost } from '../types/building'
import { BuildingTypes } from './enum'

export class Kiln extends AbstractProductionBuilding {
  constructor(public readonly capacity: number, public readonly count: number) { super() }
  workerTypeRequired: { workerType: OccupationTypes; count: number }[] = [
    {
      workerType: OccupationTypes.CHARCOAL_BURNER, count: 2
    }
  ]

  inputResources = [
    {
      resource: ResourceTypes.WOOD,
      amount: 5
    }
  ]

  outputResources = [{
    resource: ResourceTypes.CHARCOAL,
    amount: 10
  }]

  public static timeToBuild: number = 4

  public static constructionCosts: ConstructionCost[] = [{
    resource: ResourceTypes.STONE,
    amount: 15
  }, {
    resource: ResourceTypes.PLANK,
    amount: 5
  }]

  getType(): BuildingTypes {
    return BuildingTypes.KILN
  }

  formatToType(): BuildingType {
    return {
      capacity: this.capacity,
      type: this.getType(),
      count: this.count,
    }
  }
}