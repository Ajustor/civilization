import { ResourceTypes } from '../resource'
import { Building, BuildingType, ConstructionCost } from '../types/building'
import { BuildingTypes } from './enum'

export class Kiln implements Building {
  constructor(public readonly capacity: number, public readonly count: number) { }

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
      count: this.count
    }
  }
}