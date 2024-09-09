import { Citizen } from '../citizen/citizen'
import type { Building, BuildingType } from '../types/building'
import { BuildingTypes } from './enum'

export class House implements Building {
  capacity: number
  residents: Citizen[]

  constructor(capacity: number) {
    this.capacity = capacity
    this.residents = []
  }

  getType() {
    return BuildingTypes.HOUSE
  }

  addResident(citizen: Citizen): void {
    if (this.residents.length < this.capacity) {
      this.residents.push(citizen)
    }
  }

  formatToType(): BuildingType {
    return {
      capacity: this.capacity,
      type: this.getType(),
      // residents: this.residents.map((resident) => resident.formatToEntity()),
    }
  }
}
