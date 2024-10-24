import { Events } from './enum'
import { ActionInput, WorldEvent } from './interface'

export class Earthquake implements WorldEvent {
  type = Events.EARTHQUAKE

  actions({ civilizations }: Required<Pick<ActionInput, 'civilizations'>>): void {
    for (const civilization of civilizations) {
      const buildingCount = civilization.buildings.reduce((sum, { count }) => sum + count, 0)
      const min = Math.floor(Math.random() * buildingCount)
      let deleteCount = Math.floor(Math.random() * (buildingCount - min) + min)

      for (const building of civilization.buildings.toSorted(() => Math.random() - 0.5)) {
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