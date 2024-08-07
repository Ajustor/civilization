import { Citizen } from '../citizen/citizen'

export class House {
  capacity: number
  residents: Citizen[]

  constructor(capacity: number) {
    this.capacity = capacity
    this.residents = []
  }

  addResident(citizen: Citizen): void {
    if (this.residents.length < this.capacity) {
      this.residents.push(citizen)
    }
  }
}
