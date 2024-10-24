import { ResourceTypes } from '../resource'
import type { Building, BuildingType, ConstructionCost } from '../types/building'

import { BuildingTypes } from './enum'

export class House implements Building {
  capacity: number

  constructor(capacity: number, public count = 0) {
    this.capacity = capacity
  }

  public static constructionCosts: ConstructionCost[] = [{
    resource: ResourceTypes.WOOD,
    amount: 15
  }]

  getType() {
    return BuildingTypes.HOUSE
  }

  formatToType(): BuildingType {
    return {
      capacity: this.capacity,
      type: this.getType(),
      count: this.count
      // residents: this.residents.map((resident) => resident.formatToEntity()),
    }
  }
}
