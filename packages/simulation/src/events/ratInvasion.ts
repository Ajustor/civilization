import type { ActionInput, WorldEvent } from './interface'

import { Events } from './enum'
import { ResourceTypes } from '../resource'

export class RatInvasion implements WorldEvent {
  type = Events.RAT_INVASION

  actions({ civilizations }: Required<ActionInput>): void {
    for (const civilization of civilizations) {
      const food = civilization.getResource(ResourceTypes.RAW_FOOD)

      const uneatableFood = civilization.getStorageCapacity(ResourceTypes.RAW_FOOD)

      if (food.quantity && uneatableFood < food.quantity) {
        const rawLoss = food.quantity - uneatableFood
        const reduction = civilization.getEventDamageReduction(Events.RAT_INVASION)
        food.decrease(Math.floor(rawLoss * (1 - reduction)))
      }
    }
  }
}
