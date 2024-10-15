import { PeopleType } from '@ajustor/simulation'
import { civilizationMapper, CivilizationService, MongoCivilizationType } from '../civilizations/service'
import { CivilizationModel } from '../../libs/database/models'

export class PeopleService {

  constructor(private readonly civilizationService: CivilizationService) {

  }

  public async getPeopleFromCivilization(civilizationId: string, withLineage = false): Promise<PeopleType[]> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId).populate('people', '-lineage')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    return civilizationMapper(civilization, { people: true }).people.map((person) => {
      const formatedPerson = person.formatToType()

      if (!withLineage) {
        delete formatedPerson.lineage
      }

      return formatedPerson
    })
  }

}