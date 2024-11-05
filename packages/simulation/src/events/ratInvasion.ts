import { ActionInput, WorldEvent } from './interface'

import { Events } from './enum'
import { ResourceTypes } from '../resource'

export class RatInvasion implements WorldEvent {
  type = Events.RAT_INVASION

  actions({ civilizations }: Required<ActionInput>): void {
    
    for (const civilization of civilizations) {
      const food = civilization.getResource(ResourceTypes.FOOD)

      if (food.quantity) {
        food.decrease(food.quantity)
      }
    }
  }

}