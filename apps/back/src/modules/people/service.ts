import { Gender, People, PeopleBuilder, PeopleEntity, PeopleType } from '@ajustor/simulation'
import { MongoCivilizationType } from '../civilizations/service'
import { CivilizationModel, PersonModel } from '../../libs/database/models'
import { SortOrder } from 'mongoose'

export const personMapper = ({ id, name, gender, month, lifeCounter, occupation, buildingMonthsLeft, isBuilding, pregnancyMonthsLeft, child, lineage }: PeopleType): People => {
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
}

export class PeopleService {

  constructor() {

  }

  public async getPeopleFromCivilization(civilizationId: string, withLineage = false): Promise<PeopleType[]> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    const rawPeople = await PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }, !withLineage ? '-lineage' : undefined)
    const formatedPeople = []
    for (const rawPerson of rawPeople) {
      const formatedPerson = personMapper(rawPerson).formatToType()

      if (!withLineage) {
        delete formatedPerson.lineage
      }

      formatedPeople.push(formatedPerson)
    }

    return formatedPeople
  }

  public async getRawPeopleFromCivilization(civilizationId: string, withLineage = false): Promise<PeopleEntity[]> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    return PersonModel.find<PeopleEntity>({ _id: { $in: civilization.people } }, !withLineage ? '-lineage' : undefined)
  }

  public async getPeopleFromCivilizationPaginated(civilizationId: string, count: number, page: number, sort?: { field: string, order: SortOrder }): Promise<PeopleType[]> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    const rawPeopleRequest = PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).sort('_id')

    if (sort) {
      rawPeopleRequest.sort({ [sort.field]: sort.order })
    }

    const rawPeople = await rawPeopleRequest.skip(page * count).limit(count)

    const formatedPeople = []
    for (const rawPerson of rawPeople) {
      const formatedPerson = personMapper(rawPerson).formatToType()


      formatedPeople.push(formatedPerson)
    }

    return formatedPeople
  }

  public async* getPeopleStreamFromCivilization(civilizationId: string, batchSize: number) {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    const cursor = PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }, '-lineage').lean().batchSize(batchSize).cursor()

    for (let rawPerson = await cursor.next(); rawPerson !== null; rawPerson = await cursor.next()) {
      yield personMapper(rawPerson as unknown as PeopleType).formatToType()
    }
  }

  public async countPeople(civilizationId: string): Promise<number> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }
    return PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).countDocuments()
  }

  public async countGenders(civilizationId: string): Promise<{ men: number, women: number }> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    const men = await PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).countDocuments({ gender: Gender.MALE })
    const women = await PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).countDocuments({ gender: Gender.FEMALE })
    return { men, women }
  }

  public async countPregnant(civilizationId: string): Promise<number> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    return PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).countDocuments({ child: { $ne: null } })
  }

}