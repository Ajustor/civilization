import { Fire, Migration, RatInvasion } from './events'
import { Resource, ResourceTypes } from './resource'

import { Civilization } from './civilization'
import { resolveBattle } from './combat'
import type { CivilizationType } from './types/civilization'
import { v4 as randomUUID } from 'uuid'
import type { CombatRecord, PlunderedResource } from './types/combat'
import { Earthquake } from './events/earthquake'
import { Events } from './events/enum'
import { Starvation } from './events/starvation'
import type { WorldEvent } from './events/interface'
import { formatCivilizations } from './formatters/civilization'
import { isWithinChance } from './utils'

export type WorldInfos = {
  id: string
  name: string
  resources: { type: ResourceTypes; quantity: number }[]
  month: number
  year: number
  nextEvent: Events | null
  civilizations: CivilizationType[]
  config: WorldConfig
}

export type WorldConfig = {
  BASE_FOOD_GENERATION: number
  BASE_WOOD_GENERATION: number
  EVENT_CHANCE: number
  // Nombre de mois simulés par tick quand TOUTES les civilisations du monde sont
  // en mode rapide (par défaut 12 = un an).
  SPEED_MODE_MONTHS: number
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

const defaultConfig: WorldConfig = {
  BASE_WOOD_GENERATION: 15_000,
  BASE_FOOD_GENERATION: 30_000,
  EVENT_CHANCE: 30,
  SPEED_MODE_MONTHS: 12,
}

// Fraction of the gap between two trading civilizations that is closed each
// month. 1 fully equalizes their stocks toward the average every month.
const RESOURCE_EXCHANGE_SHARE = 1

const PLUNDER_RATIO = 0.25
const CAPTURE_RATIO = 0.05
const CAPTURE_CAP = 100

export class World {
  id: string
  private resources: Resource[] = []
  private _civilizations: Civilization[] = []

  public nextEvent: Events | null = null
  public lastBattles: CombatRecord[] = []

  private config: WorldConfig

  constructor(
    private readonly name = 'The world',
    private month = 0,
    config: Partial<WorldConfig> = {},
  ) {
    this.id = ''
    // Merge with defaults so a partial (custom) config can override only some
    // fields; a missing field falls back to the default rather than clobbering it.
    this.config = {
      BASE_FOOD_GENERATION: config.BASE_FOOD_GENERATION ?? defaultConfig.BASE_FOOD_GENERATION,
      BASE_WOOD_GENERATION: config.BASE_WOOD_GENERATION ?? defaultConfig.BASE_WOOD_GENERATION,
      EVENT_CHANCE: config.EVENT_CHANCE ?? defaultConfig.EVENT_CHANCE,
      SPEED_MODE_MONTHS: config.SPEED_MODE_MONTHS ?? defaultConfig.SPEED_MODE_MONTHS,
    }
  }

  getConfig(): WorldConfig {
    return this.config
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

  // Detach all civilizations from the world. Used when the same world instance
  // is reused across several simulated months (e.g. the skipYears script) so
  // freshly reloaded civilizations replace the previous ones instead of piling
  // up as duplicates.
  public clearCivilizations() {
    this._civilizations = []
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

  getCivilization(id: string): Civilization | undefined {
    return this._civilizations.find(
      ({ id: civilizationId }) => civilizationId === id,
    )
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
          ResourceTypes.RAW_FOOD,
          ~~(this.config.BASE_FOOD_GENERATION * 1.5),
        )
        this.increaseResource(
          ResourceTypes.WOOD,
          ~~(this.config.BASE_WOOD_GENERATION * 1.1),
        )

        break
      }
      case 'summer': {
        this.increaseResource(
          ResourceTypes.RAW_FOOD,
          ~~(this.config.BASE_FOOD_GENERATION * 1.75),
        )
        this.increaseResource(
          ResourceTypes.WOOD,
          ~~(this.config.BASE_WOOD_GENERATION * 1.2),
        )
        break
      }
      case 'automn': {
        this.increaseResource(
          ResourceTypes.RAW_FOOD,
          ~~(this.config.BASE_FOOD_GENERATION * 1.2),
        )
        this.increaseResource(
          ResourceTypes.WOOD,
          ~~this.config.BASE_WOOD_GENERATION,
        )
        break
      }
      case 'winter': {
        this.increaseResource(
          ResourceTypes.RAW_FOOD,
          ~~(this.config.BASE_FOOD_GENERATION * 0.5),
        )
        this.increaseResource(
          ResourceTypes.WOOD,
          ~~(this.config.BASE_WOOD_GENERATION * 0.75),
        )
        break
      }
    }

    if (this.nextEvent) {
      const event = AVAILABLE_EVENTS[this.nextEvent]()

      event.actions({ world: this, civilizations: this._civilizations })
    }

    this.createNextEvent()

    this.exchangeResources()
    this.resolveWars()

    await Promise.all(
      this._civilizations.map((civilization) => civilization.passAMonth(this)),
    )
  }

  /**
   * Civilizations that have mutually opened exchange (each one lists the other
   * in its `OPEN_EXCHANGE` config) share their resources. Every shared resource
   * type is balanced toward the average of the two stocks so that allied
   * civilizations help each other survive.
   */
  private exchangeResources(): void {
    const civilizations = this._civilizations
    for (let i = 0; i < civilizations.length; i++) {
      for (let j = i + 1; j < civilizations.length; j++) {
        const firstCivilization = civilizations[i]
        const secondCivilization = civilizations[j]

        if (
          !this.haveMutualExchange(firstCivilization, secondCivilization)
        ) {
          continue
        }

        this.balanceResources(firstCivilization, secondCivilization)
      }
    }
  }

  private resolveWars(): void {
    this.lastBattles = []
    for (const attacker of this._civilizations) {
      for (const targetId of attacker.config.AT_WAR_WITH) {
        const defender = this.getCivilization(targetId)
        if (!defender || defender === attacker) {
          continue
        }
        const record = this.resolveAttack(attacker, defender)
        if (record) {
          this.lastBattles.push(record)
        }
      }
    }
  }

  private resolveAttack(attacker: Civilization, defender: Civilization): CombatRecord | null {
    const wall = defender.wall
    if (wall && wall.count > 0) {
      defender.removeBuilding(wall)
      return null
    }

    const attackerStrength = attacker.militaryStrength
    const defenderStrength = defender.militaryStrength

    const outcome = resolveBattle(
      { strength: attackerStrength },
      { strength: defenderStrength },
    )
    if (!outcome.fought) {
      return null
    }

    attacker.loseSoldiers(outcome.attackerLossRatio)
    defender.loseSoldiers(outcome.defenderLossRatio)

    const plunderedResources: PlunderedResource[] = []
    let captivesTaken = 0

    if (outcome.attackerWins) {
      for (const resource of defender.resources) {
        const plunder = Math.floor(resource.quantity * PLUNDER_RATIO)
        if (plunder > 0) {
          defender.decreaseResource(resource.type, plunder)
          attacker.increaseResource(resource.type, plunder)
          plunderedResources.push({ type: resource.type, amount: plunder })
        }
      }

      const captureCount = Math.min(
        Math.floor(defender.people.length * CAPTURE_RATIO),
        CAPTURE_CAP,
      )
      if (captureCount > 0) {
        const captives = defender.releaseCaptives(captureCount)
        attacker.addPeople(...captives)
        captivesTaken = captives.length
      }
    }

    return {
      battleId: randomUUID(),
      month: this.getMonth(),
      worldId: this.id,
      attackerCivId: attacker.id,
      defenderCivId: defender.id,
      attackerStrength,
      defenderStrength,
      attackerWins: outcome.attackerWins,
      attackerLossRatio: outcome.attackerLossRatio,
      defenderLossRatio: outcome.defenderLossRatio,
      plunderedResources,
      captivesTaken,
    }
  }

  private haveMutualExchange(
    firstCivilization: Civilization,
    secondCivilization: Civilization,
  ): boolean {
    return (
      firstCivilization.config.OPEN_EXCHANGE.includes(secondCivilization.id) &&
      secondCivilization.config.OPEN_EXCHANGE.includes(firstCivilization.id)
    )
  }

  private balanceResources(
    firstCivilization: Civilization,
    secondCivilization: Civilization,
  ): void {
    const sharedResourceTypes = new Set<ResourceTypes>([
      ...firstCivilization.resources.map((resource) => resource.type),
      ...secondCivilization.resources.map((resource) => resource.type),
    ])

    for (const resourceType of sharedResourceTypes) {
      const firstQuantity = firstCivilization.getResource(resourceType).quantity
      const secondQuantity =
        secondCivilization.getResource(resourceType).quantity

      const gap = firstQuantity - secondQuantity
      if (gap === 0) {
        continue
      }

      const transfer = Math.floor((Math.abs(gap) / 2) * RESOURCE_EXCHANGE_SHARE)
      if (transfer <= 0) {
        continue
      }

      const [richer, poorer] =
        gap > 0
          ? [firstCivilization, secondCivilization]
          : [secondCivilization, firstCivilization]

      richer.decreaseResource(resourceType, transfer)
      poorer.increaseResource(resourceType, transfer)
    }
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
      config: this.config,
    }
  }

  private createNextEvent() {
    if (!isWithinChance(this.config.EVENT_CHANCE)) {
      this.nextEvent = null
      return
    }

    const event = Math.random() * 100

    switch (true) {
      case event < 20: {
        this.nextEvent = Events.EARTHQUAKE
        break
      }
      case event < 40: {
        this.nextEvent = Events.STARVATION
        break
      }
      case event < 45: {
        this.nextEvent = Events.FIRE
        break
      }
      case event < 50: {
        this.nextEvent = Events.RAT_INVASION
        break
      }
      case event < 80: {
        this.nextEvent = Events.MIGRATION
        break
      }
      default: {
        this.nextEvent = null
      }
    }
  }
}
