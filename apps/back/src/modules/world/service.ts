import { Gender } from '@ajustor/simulation'
import { WorldsTable } from './database'
import { CivilizationService } from '../civilizations/service'

export class WorldService {
  constructor(private readonly worldTable: WorldsTable, private readonly civilizationService: CivilizationService) {

  }

  public async getWorldMenAndWomen(worldId: string) {
    const worldCivilizations = await this.civilizationService.getAllRawByWorldId(worldId, { people: true })

    const ratio = worldCivilizations.reduce(
      (count, { people }) => {
        if (!people) {
          return count
        }

        for (const person of people) {
          if (person.gender === Gender.MALE) {
            count.men++
          }

          if (person.gender === Gender.FEMALE) {
            count.women++
          }
        }
        return count
      },
      { men: 0, women: 0 }
    )
    return ratio
  }

  public async topCivilizations(worldId: string) {
    const worldCivilizations = await this.civilizationService.getAllByWorldId(worldId, { people: false })

    return worldCivilizations.sort(
      (
        { livedMonths: firstCivilizationLivedMonths },
        { livedMonths: secondCivilizationLivedMonths }
      ) => secondCivilizationLivedMonths - firstCivilizationLivedMonths
    ).map(({ name, livedMonths }) => ({ name, livedMonths }))
  }
}