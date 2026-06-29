import type { ActionInput, WorldEvent } from './interface'

import { Events } from './enum'
import { Gender } from '../people/enum'
import { MAX_LIFE } from '../people/people'
import { OccupationTypes } from '../people/work/enum'
import { PeopleBuilder } from '../builders'
import { getRandomInt } from '../utils/random'

// Bonus le plus puissant, donc le plus rare : une vague de colons adultes
// en bonne santé rejoint chaque civilisation. Le gain en population est
// proportionnel à la taille actuelle de la civilisation.
export class GoldenAge implements WorldEvent {
  type = Events.GOLDEN_AGE

  actions({ civilizations }: Required<ActionInput>): void {
    const genders = [Gender.FEMALE, Gender.MALE]

    for (const civilization of civilizations) {
      const newcomers = Math.ceil(
        civilization.citizensCount * (getRandomInt(3, 6) / 100),
      )
      if (newcomers <= 0) {
        continue
      }

      const settlers = Array.from({ length: newcomers }, () =>
        new PeopleBuilder()
          .withMonth(getRandomInt(18, 25) * 12)
          .withGender(genders[getRandomInt(0, genders.length - 1)])
          .withLifeCounter(MAX_LIFE)
          .withOccupation(OccupationTypes.GATHERER)
          .withOriginCivilizationId(civilization.id)
          .build(),
      )

      civilization.addPeople(...settlers)
    }
  }
}
