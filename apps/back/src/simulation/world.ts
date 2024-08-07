import chalk from 'chalk'
import { Resource, ResourceType } from './resource'
import { Civilization } from './civilization'

export type WorldInfos = {
  resources: Resource[]
  month: number
  year: number
  civilizations: Civilization[]
}

export class World {
  private resources: Resource[]
  private month: number = 1
  private civilizations: Civilization[] = []

  constructor() {
    this.resources = [
      new Resource(ResourceType.FOOD, 10000),
      new Resource(ResourceType.WOOD, 5000)
    ]
  }

  public addCivilization(civilization: Civilization) {
    this.civilizations.push(civilization)
  }

  public getYear(): number {
    return ~~(this.month / 12)
  }

  getResource(type: ResourceType): Resource | undefined {
    return this.resources.find(resource => resource.type === type)
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

  passAMonth(): void {
    this.month++
    if (this.month % 2 === 0) {
      this.increaseResource(ResourceType.WOOD, 2)
    }

    if (this.month % 3 === 0) {
      this.increaseResource(ResourceType.FOOD, 100)
    }

    for (const civilization of this.civilizations) {
      civilization.passAMonth(this)
    }
  }

  getInfosFormated(): string {
    const foodResource = this.getResource(ResourceType.FOOD)
    const woodResource = this.getResource(ResourceType.WOOD)
    return `
${chalk.blue('--- World Status ---')}
${foodResource?.quantity ? chalk.green(`Available food: ${foodResource?.quantity}`) : chalk.red(`Available food: ${foodResource?.quantity}`)}
${woodResource?.quantity ? chalk.green(`Available wood: ${woodResource?.quantity}`) : chalk.red(`Available wood: ${woodResource?.quantity}`)}
${chalk.blue('---------------------------')}`
  }

  public getInfos(): WorldInfos {
    return {
      civilizations: this.civilizations,
      month: this.month,
      resources: this.resources,
      year: this.getYear()
    }
  }

  getCivilizationsInfos(): string {
    return this.civilizations.map((civilization) => civilization.getCivilizationInfos()).join('\n')
  }
}
