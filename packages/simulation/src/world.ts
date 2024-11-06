import { Fire, Migration, RatInvasion } from './events'
import { Resource, ResourceTypes } from './resource'

import { Civilization } from './civilization'
import type { CivilizationType } from './types/civilization'
import { Earthquake } from './events/earthquake'
import { Events } from './events/enum'
import { Starvation } from './events/starvation'
import { WorldEvent } from './events/interface'
import { formatCivilizations } from './formatters/civilization'
import { isWithinChance } from './utils'

export const BASE_FOOD_GENERATION = 30_000_000
export const BASE_WOOD_GENERATION = 15_000_000

const EVENT_CHANCE = 70

export type WorldInfos = {
  id: string
  name: string
  resources: { type: ResourceTypes; quantity: number }[]
  month: number
  year: number
  nextEvent: Events | null
  civilizations: CivilizationType[]
}

const seasons = {
  spring: [0, 1, 2],
  summer: [3, 4, 5],
  automn: [6, 7, 8],
  winter: [9, 10, 11],
}

const AVAILABLE_EVENTS: {
  [key in Events]: () => WorldEvent
} = {
  [Events.EARTHQUAKE]: () => new Earthquake(),
  [Events.STARVATION]: () => new Starvation(),
  [Events.MIGRATION]: () => new Migration(),
  [Events.FIRE]: () => new Fire(),
  [Events.RAT_INVASION]: () => new RatInvasion(),
}

export class World {
  id: string
  private resources: Resource[] = []
  private _civilizations: Civilization[] = []

  public nextEvent: Events | null = null

  constructor(
    private readonly name = 'The world',
    private month = 0,
  ) {
    this.id = ''
  }

  get season(): string {
    const [currentSeason] =
      Object.entries(seasons).find(([_, months]) =>
        months.includes(this.month % 12),
      ) ?? []
    return currentSeason ?? ''
  }

  get civilizations(): Civilization[] {
    return this._civilizations
  }

  public addCivilization(...civilizations: Civilization[]) {
    this._civilizations.push(...civilizations)
  }

  public getYear(): number {
    return ~~(this.month / 12)
  }

  public getMonth(): number {
    return this.month
  }

  public getName(): string {
    return this.name
  }

  public getResources(): Resource[] {
    return this.resources
  }

  getResource(type: ResourceTypes): Resource | undefined {
    return this.resources.find((resource) => resource.type === type)
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

  async passAMonth(): Promise<void> {
    this.month++
    switch (this.season) {
      case 'spring': {
        this.increaseResource(
          ResourceTypes.FOOD,
          ~~(BASE_FOOD_GENERATION * 1.5),
        )
        this.increaseResource(
          ResourceTypes.WOOD,
          ~~(BASE_WOOD_GENERATION * 1.1),
        )

        break
      }
      case 'summer': {
        this.increaseResource(
          ResourceTypes.FOOD,
          ~~(BASE_FOOD_GENERATION * 1.75),
        )
        this.increaseResource(
          ResourceTypes.WOOD,
          ~~(BASE_WOOD_GENERATION * 1.2),
        )
        break
      }
      case 'automn': {
        this.increaseResource(
          ResourceTypes.FOOD,
          ~~(BASE_FOOD_GENERATION * 1.2),
        )
        this.increaseResource(ResourceTypes.WOOD, ~~BASE_WOOD_GENERATION)
        break
      }
      case 'winter': {
        this.increaseResource(
          ResourceTypes.FOOD,
          ~~(BASE_FOOD_GENERATION * 0.5),
        )
        this.increaseResource(
          ResourceTypes.WOOD,
          ~~(BASE_WOOD_GENERATION * 0.75),
        )
        break
      }
    }

    if (this.nextEvent) {
      const event = AVAILABLE_EVENTS[this.nextEvent]()

      event.actions({ world: this, civilizations: this._civilizations })
    }

    this.createNextEvent()

    await Promise.all(
      this._civilizations.map((civilization) => civilization.passAMonth(this)),
    )
  }

  public getInfos(): WorldInfos {
    return {
      id: this.id,
      name: this.name,
      civilizations: formatCivilizations(this._civilizations),
      month: this.month % 12,
      resources: this.resources.map((resource) => ({
        type: resource.type,
        quantity: resource.quantity,
      })),
      nextEvent: this.nextEvent,
      year: this.getYear(),
    }
  }

  private createNextEvent() {
    if (!isWithinChance(EVENT_CHANCE)) {
      this.nextEvent = null
      return
    }

    const event = Math.random() * 100

    switch (true) {
      case 20 > event && event > 0: {
        this.nextEvent = Events.EARTHQUAKE
        break
      }
      case 40 > event && event > 20: {
        this.nextEvent = Events.EARTHQUAKE
        break
      }
      case 60 > event && event > 40: {
        this.nextEvent = Events.FIRE
        break
      }
      case 80 > event && event > 60: {
        this.nextEvent = Events.RAT_INVASION
        break
      }
      case 100 > event && event > 80: {
        this.nextEvent = Events.MIGRATION
        break
      }
      default:
        this.nextEvent = null
    }
  }
}
