import chalk from 'chalk'
import { Resource, ResourceType } from './resource'
import { Civilization } from './civilization'
import { formatCivilizations } from '../modules/civilizations'

export type WorldInfos = {
  name: string
  resources: { type: ResourceType, quantity: number }[]
  month: number
  year: number
  civilizations: Record<string, any>[]
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

  getResource(type: ResourceType): Resource | undefined {
    return this.resources.find(resource => resource.getType() === type)
  }

  decreaseResource(type: ResourceType, amount: number): void {
    const resource = this.getResource(type)
    if (resource) {
      resource.decrease(amount)
    }
  }

  increaseResource(type: ResourceType, amount: number): void {
    const resource = this.getResource(type)
    if (resource) {
      resource.increase(amount)
    }
  }

  addResource(resource: Resource): void {
    this.resources.push(resource)
  }

  passAMonth(): void {
    this.month++
    const [currentSeason] = Object.entries(seasons).find(([_, months]) => months.includes(this.month % 12)) ?? []
    switch (currentSeason) {
      case 'spring': {
        this.increaseResource(ResourceType.FOOD, 100 + 100 * this.civilizations.length)
        break
      }
      case 'summer': {
        this.increaseResource(ResourceType.FOOD, 75 + 75 * this.civilizations.length)
        break
      }
      case 'automn': {
        this.increaseResource(ResourceType.FOOD, 25 + 25 * this.civilizations.length)
        this.increaseResource(ResourceType.WOOD, 10)
        break
      }
      case 'winter': {
        this.increaseResource(ResourceType.WOOD, 20)
        break
      }
    }

    for (const civilization of this.civilizations) {
      civilization.passAMonth(this)
    }
  }

  getInfosFormated(): string {
    const foodResource = this.getResource(ResourceType.FOOD)
    const woodResource = this.getResource(ResourceType.WOOD)
    return `
${chalk.blue(`--- ${this.name} Status ---`)}
${foodResource?.getQuantity() ? chalk.green(`Available food: ${foodResource?.getQuantity()}`) : chalk.red(`Available food: ${foodResource?.getQuantity()}`)}
${woodResource?.getQuantity() ? chalk.green(`Available wood: ${woodResource?.getQuantity()}`) : chalk.red(`Available wood: ${woodResource?.getQuantity()}`)}
${chalk.blue('---------------------------')}`
  }

  public getInfos(): WorldInfos {
    return {
      name: this.name,
      civilizations: formatCivilizations(this.civilizations),
      month: this.month % 12,
      resources: this.resources.map((resource) => ({
        type: resource.getType(),
        quantity: resource.getQuantity()
      })),
      year: this.getYear()
    }
  }

  getCivilizationsInfos(): string {
    return this.civilizations.map((civilization) => civilization.getCivilizationInfos()).join('\n')
  }
}
