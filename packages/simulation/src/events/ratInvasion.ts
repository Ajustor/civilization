import { ActionInput, WorldEvent } from './interface'

import { Events } from './enum'
import { ResourceTypes } from '../resource'

export class RatInvasion implements WorldEvent {
  type = Events.RAT_INVASION

  actions({ civilizations }: Required<ActionInput>): void {
    for (const civilization of civilizations) {
      const food = civilization.getResource(ResourceTypes.RAW_FOOD)

      const protectedFood = civilization
        .getStorageBuildings()
        .reduce<number>((sum, building) => {
          return (
            sum +
            (building.storedResources.find(
              (storedResource) =>
                storedResource.resource === ResourceTypes.RAW_FOOD,
            )?.maxQuantity ?? 0) *
              building.count
          )
        }, 0)

      if (food.quantity && food.quantity < protectedFood) {
        food.decrease(food.quantity - protectedFood)
      }
    }
  }
}
