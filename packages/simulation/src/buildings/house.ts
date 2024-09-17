import type { Building, BuildingType } from '../types/building'

import { BuildingTypes } from './enum'

export class House implements Building {
  capacity: number
  count: number = 0

  constructor(capacity: number) {
    this.capacity = capacity
  }

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
