import { Citizen } from '../citizen/citizen'
import { Building, BuildingEntity } from './buildings.type'
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

  formatToEntity(): BuildingEntity {
    return {
      capacity: this.capacity,
      type: this.getType(),
      residents: this.residents.map((resident) => resident.formatToEntity()),
    }
  }
}
