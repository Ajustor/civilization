import { WorldsTable } from './database'
import { CivilizationService } from '../civilizations/service'

export class WorldService {
  constructor(private readonly worldTable: WorldsTable, private readonly civilizationService: CivilizationService) {

  }

  public async getWorldMenAndWomen(worldId: string) {
    return this.civilizationService.countGenderForWorld(worldId)
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