import { PeopleType } from '@ajustor/simulation'
import { CivilizationService } from '../civilizations/service'

export class PeopleService {

  constructor(private readonly civilizationService: CivilizationService) {

  }
  public async getPeopleFromCivilization(civilizationId: string, withLineage = false): Promise<PeopleType[]> {
    const civilization = await this.civilizationService.getById(civilizationId)
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    return civilization.people.map((person) => {
      const formatedPerson = person.formatToType()

      if (!withLineage) {
        delete formatedPerson.lineage
      }

      return formatedPerson
    })
  }

}