import { ActionInput, WorldEvent } from './interface'

import { Events } from './enum'
import { ResourceTypes } from '../resource'

export class Fire implements WorldEvent {
  type = Events.FIRE

  actions({ civilizations }: Required<ActionInput>): void {
    for (const civilization of civilizations) {
      const wood = civilization.getResource(ResourceTypes.WOOD)

      const unburnableWood = civilization
        .getStorageBuildings()
        .reduce<number>((sum, building) => {
          return (
            sum +
            (building.storedResources.find(
              (storedResource) =>
                storedResource.resource === ResourceTypes.WOOD,
            )?.maxQuantity ?? 0) *
              building.count
          )
        }, 0)
      if (wood.quantity && unburnableWood < wood.quantity) {
        wood.decrease(wood.quantity - unburnableWood)
      }
    }
  }
}
