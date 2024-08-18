import { Citizen } from '../citizen/citizen'
import { Building } from './buildings.type'
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
}
