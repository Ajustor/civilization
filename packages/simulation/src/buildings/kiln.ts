import { ResourceTypes } from '../resource'
import { BuildingType, ConstructionCost, ProductionBuilding } from '../types/building'
import { BuildingTypes } from './enum'

export class Kiln implements ProductionBuilding {
  constructor(public readonly capacity: number, public readonly count: number) { }

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