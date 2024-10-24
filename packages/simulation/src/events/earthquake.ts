import { Events } from './enum'
import { ActionInput, WorldEvent } from './interface'

export class Earthquake implements WorldEvent {
  type = Events.EARTHQUAKE

  actions({ civilizations }: Required<Pick<ActionInput, 'civilizations'>>): void {
    for (const civilization of civilizations) {
      const random = Math.floor(Math.random() * civilization.buildings.length)
      const min = Math.floor(Math.random() * civilization.buildings.length)
      const deleteCount = Math.floor(Math.random() * (civilization.buildings.length - min) + min)

      civilization.buildings.splice(random, deleteCount)
    }
  }

}