import type { ActionInput, WorldEvent } from './interface'

import { Events } from './enum'

export class Earthquake implements WorldEvent {
  type = Events.EARTHQUAKE

  actions({
    civilizations,
  }: Required<Pick<ActionInput, 'civilizations'>>): void {
    for (const civilization of civilizations) {
      const buildings = civilization.getDestructibleBuildings()
      const buildingCount = buildings.reduce((sum, { count }) => sum + count, 0)
      const reduction = civilization.getEventDamageReduction(Events.EARTHQUAKE)
      const min = Math.floor(Math.random() * buildingCount * (1 - reduction))
      let deleteCount = Math.floor(Math.random() * (buildingCount * (1 - reduction) - min) + min)

      for (const building of buildings.toSorted(() => Math.random() - 0.5)) {
        const random = Math.floor(Math.random() * deleteCount)
        deleteCount -= random
        building.count -= random

        if (building.count < 0) {
          building.count = 0
        }
        if (deleteCount <= 0) {
          break
        }
      }
    }
  }
}
