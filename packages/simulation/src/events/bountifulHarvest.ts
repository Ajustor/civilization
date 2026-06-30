import type { ActionInput, WorldEvent } from './interface'

import { Events } from './enum'
import { ResourceTypes } from '../resource'
import { getRandomInt } from '../utils/random'

// Bonus modeste et le plus fréquent : un surplus de nourriture brute,
// proportionnel à la population de chaque civilisation.
export class BountifulHarvest implements WorldEvent {
  type = Events.BOUNTIFUL_HARVEST

  actions({ civilizations }: Required<ActionInput>): void {
    for (const civilization of civilizations) {
      const food = civilization.getResource(ResourceTypes.RAW_FOOD)
      if (!food) {
        continue
      }
      food.increase(civilization.citizensCount * getRandomInt(3, 6))
    }
  }
}
