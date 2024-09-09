import { Resource, ResourceTypes } from './resource'
import { Civilization } from './civilization'
import { formatCivilizations } from './formatters/civilization'
import type { CivilizationType } from './types/civilization'

export type WorldInfos = {
  name: string
  resources: { type: ResourceTypes, quantity: number }[]
  month: number
  year: number
  civilizations: CivilizationType[]
}

const seasons = {
  spring: [0, 1, 2],
  summer: [3, 4, 5],
  automn: [6, 7, 8],
  winter: [9, 10, 11]
}

export class World {
  id: string
  private resources: Resource[] = []
  private civilizations: Civilization[] = []

  constructor(private readonly name = 'The world', private month = 1) {
    this.id = ''
  }

  public addCivilization(...civilizations: Civilization[]) {
    this.civilizations.push(...civilizations)
  }

  public getYear(): number {
    return ~~(this.month / 12)
  }

  public getName(): string {
    return this.name
  }

  public getResources(): Resource[] {
    return this.resources
  }

  getResource(type: ResourceTypes): Resource | undefined {
    return this.resources.find(resource => resource.type === type)
  }

  decreaseResource(type: ResourceTypes, amount: number): void {
    const resource = this.getResource(type)
    if (resource) {
      resource.decrease(amount)
    }
  }

  increaseResource(type: ResourceTypes, amount: number): void {
    const resource = this.getResource(type)
    if (resource) {
      resource.increase(amount)
    }
  }

  addResource(...resources: Resource[]): void {
    this.resources.push(...resources)
  }

  passAMonth(): void {
    this.month++
    const [currentSeason] = Object.entries(seasons).find(([_, months]) => months.includes(this.month % 12)) ?? []
    switch (currentSeason) {
      case 'spring': {
        this.increaseResource(ResourceTypes.FOOD, 50 + 20 * this.civilizations.length)
        break
      }
      case 'summer': {
        this.increaseResource(ResourceTypes.FOOD, 25 + 10 * this.civilizations.length)
        break
      }
      case 'automn': {
        this.increaseResource(ResourceTypes.FOOD, 10 + 5 * this.civilizations.length)
        this.increaseResource(ResourceTypes.WOOD, 10)
        break
      }
      case 'winter': {
        this.increaseResource(ResourceTypes.WOOD, 20)
        break
      }
    }

    for (const civilization of this.civilizations) {
      civilization.passAMonth(this)
    }
  }

  public getInfos(): WorldInfos {
    return {
      name: this.name,
      civilizations: formatCivilizations(this.civilizations),
      month: this.month % 12,
      resources: this.resources.map((resource) => ({
        type: resource.type,
        quantity: resource.quantity
      })),
      year: this.getYear()
    }
  }

}
