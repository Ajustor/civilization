import { ResourceTypes } from '../resource'
import type { Building, BuildingType, ConstructionCost } from '../types/building'
import { BuildingTypes } from './enum'

export class Farm implements Building {
  capacity?: number | undefined

  constructor(capacity: number, public count = 0) {
    this.capacity = capacity
  }

  public static constructionCosts: ConstructionCost[] = [{
    resource: ResourceTypes.WOOD,
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