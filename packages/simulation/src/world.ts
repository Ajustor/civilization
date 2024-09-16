import { Resource, ResourceTypes } from './resource'
import { Civilization } from './civilization'
import { formatCivilizations } from './formatters/civilization'
import type { CivilizationType } from './types/civilization'

const BASE_FOOD_GENERATION = 30_000_000
const BASE_WOOD_GENERATION = 15_000_000

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
        this.increaseResource(ResourceTypes.FOOD, BASE_FOOD_GENERATION * 1.5)
        this.increaseResource(ResourceTypes.WOOD, BASE_WOOD_GENERATION * 1.1)

        break
      }
      case 'summer': {
        this.increaseResource(ResourceTypes.FOOD, BASE_FOOD_GENERATION * 1.75)
        this.increaseResource(ResourceTypes.WOOD, BASE_WOOD_GENERATION * 1.2)
        break
      }
      case 'automn': {
        this.increaseResource(ResourceTypes.FOOD, BASE_FOOD_GENERATION * 1.2)
        this.increaseResource(ResourceTypes.WOOD, BASE_WOOD_GENERATION)
        break
      }
      case 'winter': {
        this.increaseResource(ResourceTypes.FOOD, BASE_FOOD_GENERATION * 0.5)
        this.increaseResource(ResourceTypes.WOOD, BASE_WOOD_GENERATION * 0.75)
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
