import type { ActionInput, WorldEvent } from './interface'

import { Events } from './enum'
import { ResourceTypes } from '../resource'
import { getRandomInt } from '../utils/random'

// Bonus intermédiaire : une caravane apporte bois et pierre,
// proportionnellement à la population de chaque civilisation.
export class TradeCaravan implements WorldEvent {
  type = Events.TRADE_CARAVAN

  actions({ civilizations }: Required<ActionInput>): void {
    for (const civilization of civilizations) {
      const wood = civilization.getResource(ResourceTypes.WOOD)
      const stone = civilization.getResource(ResourceTypes.STONE)

      if (wood) {
        wood.increase(civilization.citizensCount * getRandomInt(2, 4))
      }
      if (stone) {
        stone.increase(civilization.citizensCount * getRandomInt(1, 2))
      }
    }
  }
}
