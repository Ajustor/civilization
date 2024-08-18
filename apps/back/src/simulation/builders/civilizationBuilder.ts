import { uniqueNamesGenerator, countries } from 'unique-names-generator'
import { House } from '../buildings/house'
import { Citizen } from '../citizen/citizen'
import { Civilization } from '../civilization'
import { Resource } from '../resource'

export class CivilizationBuilder {
  private name: string
  private citizens: Citizen[] = [];
  private resources: Resource[] = [];
  private houses: House[] = [];

  constructor() {
    this.name = uniqueNamesGenerator({ dictionaries: [countries] })
  }

  withName(name: string): this {
    this.name = name
    return this
  }

  addCitizen(...citizens: Citizen[]): this {
    this.citizens.push(...citizens)
    return this
  }

  addResource(...resources: Resource[]): this {
    this.resources.push(...resources)
    return this
  }

  addHouse(...houses: House[]): this {
    this.houses.push(...houses)
    return this
  }

  build(): Civilization {
    const civilization = new Civilization()
    civilization.addCitizen(...this.citizens)
    civilization.addResource(...this.resources)
    civilization.addBuilding(...this.houses)

    // Override the default generated name if the name was set using withName
    if (this.name) {
      civilization.name = this.name
    }

    return civilization
  }
}