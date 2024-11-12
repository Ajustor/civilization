import { ActionInput, WorldEvent } from './interface'

import { Events } from './enum'
import { ResourceTypes } from '../resource'

export class Fire implements WorldEvent {
  type = Events.FIRE

  actions({ civilizations }: Required<ActionInput>): void {
    for (const civilization of civilizations) {
      const wood = civilization.getResource(ResourceTypes.WOOD)

      if (wood.quantity) {
        wood.decrease(wood.quantity - 100)
      }
    }
  }
}
