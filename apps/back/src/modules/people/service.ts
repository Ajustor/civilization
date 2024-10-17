import { Gender, People, PeopleBuilder, PeopleType } from '@ajustor/simulation'
import { CivilizationService, MongoCivilizationType } from '../civilizations/service'
import { CivilizationModel, PersonModel } from '../../libs/database/models'

export const peopleMapper = (people: PeopleType[]): People[] => {
  return people.map(({ id, name, gender, month, lifeCounter, occupation, buildingMonthsLeft, isBuilding, pregnancyMonthsLeft, child, lineage }) => {
    const peopleBuilder = new PeopleBuilder()
      .withId(id)
      .withGender(gender)
      .withMonth(month)
      .withName(name)
      .withLifeCounter(lifeCounter)
      .withIsBuilding(isBuilding)
      .withBuildingMonthsLeft(buildingMonthsLeft)

    if (occupation) {
      peopleBuilder.withOccupation(occupation)
    }

    if (pregnancyMonthsLeft && gender === Gender.FEMALE) {
      peopleBuilder.withPregnancyMonthsLeft(pregnancyMonthsLeft)
    }

    if (child && gender === Gender.FEMALE) {
      peopleBuilder.withChild(child)
    }

    if (lineage) {
      peopleBuilder.withLineage(lineage)
    }

    return peopleBuilder.build()
  })
}

export class PeopleService {

  constructor(private readonly civilizationService: CivilizationService) {

  }

  public async getPeopleFromCivilization(civilizationId: string, withLineage = false): Promise<PeopleType[]> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    const people = await PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }, !withLineage ? '-lineage' : undefined)
    return peopleMapper(people).map((person) => {
      const formatedPerson = person.formatToType()

      if (!withLineage) {
        delete formatedPerson.lineage
      }

      return formatedPerson
    })
  }

  public async getPeopleFromCivilizationPaginated(civilizationId: string, count: number, page: number): Promise<PeopleType[]> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    const people = await PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).sort('_id').skip(page * count).limit(count)

    return peopleMapper(people).map((person) => {
      const formatedPerson = person.formatToType()
      return formatedPerson
    })
  }

}