import { ResourceTypes } from '../resource'
import { Events } from './enum'
import type { ActionInput, WorldEvent } from './interface'

export class Starvation implements WorldEvent {
  type = Events.STARVATION

  actions({ civilizations, world }: Required<ActionInput>): void {
    const worldFood = world.getResource(ResourceTypes.RAW_FOOD)

    if (worldFood) {
      const randomDecrease = Math.floor(Math.random() * (worldFood.quantity))

      worldFood.decrease(randomDecrease)
    }

    for (const civilization of civilizations) {
      const civilizationFood = civilization.getResource(ResourceTypes.RAW_FOOD)

      if (civilizationFood) {
        const reduction = civilization.getEventDamageReduction(Events.STARVATION)
        const rawDecrease = Math.floor(Math.random() * civilizationFood.quantity)
        civilizationFood.decrease(Math.floor(rawDecrease * (1 - reduction)))
      }
    }
  }

}
