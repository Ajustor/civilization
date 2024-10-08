import { countries, uniqueNamesGenerator } from 'unique-names-generator'

import type { Building } from '../types/building'
import { Civilization } from '../civilization'
import { People } from '../people/people'
import { Resource } from '../resource'

export class CivilizationBuilder {
  private id?: string
  private name: string
  private people: People[] = [];
  private resources: Resource[] = [];
  private buildings: Building[] = []
  private livedMonths: number

  constructor() {
    this.name = uniqueNamesGenerator({ dictionaries: [countries] })
    this.livedMonths = 0
  }

  withName(name: string): this {
    this.name = name
    return this
  }

  withLivedMonths(livedMonths: number): this {
    this.livedMonths = livedMonths
    return this
  }

  addCitizen(...people: People[]): this {
    this.people.push(...people)
    return this
  }

  addResource(...resources: Resource[]): this {
    for (const resource of resources) {
      const foundResources = this.resources.find(({ type }) => type === resource.type)
      if (foundResources) {
        foundResources.increase(resource.quantity)
      } else {
        this.resources.push(resource)
      }
    }
    return this
  }

  addBuilding(...buildings: Building[]): this {
    for (const building of buildings) {
      const foundBuilding = this.buildings.find((existingBuilding) => existingBuilding.getType() === building.getType())
      if (foundBuilding) {
        foundBuilding.count++
      } else {
        this.buildings.push(building)
      }
    }
    return this
  }

  withId(id: string): this {
    this.id = id
    return this
  }

  build(): Civilization {
    const civilization = new Civilization()
    civilization.addPeople(...this.people)
    civilization.addResource(...this.resources)
    civilization.addBuilding(...this.buildings)

    civilization.livedMonths = this.livedMonths

    if (this.id) {
      civilization.id = this.id
    }

    // Override the default generated name if the name was set using withName
    if (this.name) {
      civilization.name = this.name
    }

    this.people = []
    this.resources = []
    this.buildings = []
    this.name = ''
    this.livedMonths = 0
    this.id = ''

    return civilization
  }
}