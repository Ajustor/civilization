import type { ActionInput, WorldEvent } from './interface'

import { Events } from './enum'
import { ResourceTypes } from '../resource'

export class Fire implements WorldEvent {
  type = Events.FIRE

  actions({ civilizations }: Required<ActionInput>): void {
    for (const civilization of civilizations) {
      const wood = civilization.getResource(ResourceTypes.WOOD)

      const unburnableWood = civilization.getStorageCapacity(ResourceTypes.WOOD)
      if (wood.quantity && unburnableWood < wood.quantity) {
        const rawLoss = wood.quantity - unburnableWood
        const reduction = civilization.getEventDamageReduction(Events.FIRE)
        wood.decrease(Math.floor(rawLoss * (1 - reduction)))
      }
    }
  }
}
