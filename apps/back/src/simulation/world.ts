import chalk from 'chalk'
import { Resource, ResourceType } from './resource'
import { Civilization } from './civilization'

export type WorldInfos = {
  name: string
  resources: Resource[]
  month: number
  year: number
  civilizations: Civilization[]
}

export class World {
  private resources: Resource[] = []
  private civilizations: Civilization[] = []

  constructor(private readonly name = 'The world', private month = 1) {
  }

  setResource(type: ResourceType, quantity: number) {
    const existingResource = this.resources.find((resource) => resource.getType() === type)

    if (existingResource) {
      existingResource.quantity = quantity
    } else {
      this.resources.push(new Resource(type, quantity))
    }
  }

  public addCivilization(civilization: Civilization) {
    this.civilizations.push(civilization)
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
${chalk.blue(`--- ${this.name} Status ---`)}
${foodResource?.quantity ? chalk.green(`Available food: ${foodResource?.quantity}`) : chalk.red(`Available food: ${foodResource?.quantity}`)}
${woodResource?.quantity ? chalk.green(`Available wood: ${woodResource?.quantity}`) : chalk.red(`Available wood: ${woodResource?.quantity}`)}
${chalk.blue('---------------------------')}`
  }

  public getInfos(): WorldInfos {
    return {
      name: this.name,
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
