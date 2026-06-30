import type { Civilization } from '../civilization'
import { Events } from '../events/enum'
import { Resource } from '../resource'
import { World, type WorldConfig } from '../world'

export class WorldBuilder {
  private id: string = ''
  private name: string = 'The world';
  private month: number = 1;
  private resources: Resource[] = [];
  private civilizations: Civilization[] = [];
  private nextEvent: Events | null = null
  private lastEvent: Events | null = null
  private eventStreak: number = 0
  private config?: WorldConfig

  withConfig(config?: Partial<WorldConfig> | null): this {
    if (config) {
      this.config = config as WorldConfig
    }
    return this
  }

  withId(id: string): this {
    this.id = id
    return this
  }

  withName(name: string): this {
    this.name = name
    return this
  }

  startingMonth(month: number): this {
    this.month = month
    return this
  }

  addResource(...resources: Resource[]): this {
    this.resources.push(...resources)
    return this
  }

  addCivilization(...civilizations: Civilization[]): this {
    this.civilizations.push(...civilizations)
    return this
  }

  withNextEvent(nextEvent: Events | null): this {
    this.nextEvent = nextEvent
    return this
  }

  withLastEvent(lastEvent: Events | null): this {
    this.lastEvent = lastEvent
    return this
  }

  withEventStreak(eventStreak: number): this {
    this.eventStreak = eventStreak
    return this
  }

  build(): World {
    const world = new World(this.name, this.month, this.config)
    world.id = this.id

    world.nextEvent = this.nextEvent
    world.lastEvent = this.lastEvent
    world.eventStreak = this.eventStreak

    // Add resources
    for (const resource of this.resources) {
      world.addResource(resource)
    }

    // Add civilizations
    for (const civilization of this.civilizations) {
      world.addCivilization(civilization)
    }

    return world
  }
}