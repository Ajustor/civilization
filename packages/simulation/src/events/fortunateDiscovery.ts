import type { ActionInput, WorldEvent } from './interface'

import { Events } from './enum'
import { getRandomInt } from '../utils/random'

// Bonus fort et rare : un afflux de points de recherche,
// proportionnel à la population de chaque civilisation.
export class FortunateDiscovery implements WorldEvent {
  type = Events.FORTUNATE_DISCOVERY

  actions({ civilizations }: Required<ActionInput>): void {
    for (const civilization of civilizations) {
      civilization.researchPoints += civilization.citizensCount * getRandomInt(1, 3)
    }
  }
}
