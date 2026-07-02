import { Gender, OccupationTypes, People, PeopleBuilder, type PeopleEntity, type PeopleType } from '@ajustor/simulation'
import type { MongoCivilizationType } from '../civilizations/service'
import { CivilizationModel, PersonModel } from '../../libs/database/models'
import { type AnyBulkWriteOperation, type SortOrder } from 'mongoose'

export const personMapper = ({ id, name, gender, month, lifeCounter, occupation, buildingMonthsLeft, isBuilding, buildingType, pregnancyMonthsLeft, child, lineage, originCivilizationId }: PeopleType): People => {
  const peopleBuilder = new PeopleBuilder()
    .withId(id)
    .withGender(gender)
    .withMonth(month)
    .withLifeCounter(lifeCounter)
    .withIsBuilding(isBuilding)
    .withBuildingMonthsLeft(buildingMonthsLeft)
    .withBuildingType(buildingType ?? null)
    .withOriginCivilizationId(originCivilizationId)

  if (name) {
    peopleBuilder.withName(name)
  }

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

  public async snap() {
    const deletedPeople: string[] = []
    const bulkOperations: AnyBulkWriteOperation<PeopleEntity>[] = []

    const numberOfPeople = await PersonModel.find().countDocuments()
    const numberToDelete = ~~(numberOfPeople / 2)

    console.log(`SNAP ${numberToDelete} people will be snapped`)

    const cursor = PersonModel.find({}, 'id').batchSize(100000).cursor()

    const people = []

    for await (const rawPeople of cursor) {
      people.push(rawPeople)
    }

    for (const rawPerson of people.sort(() => Math.random() - 0.5)) {
      if (numberToDelete < deletedPeople.length) {
        break
      }
      deletedPeople.push(rawPerson.id.toString())

      bulkOperations.push({
        deleteOne: {
          filter: {
            _id: rawPerson.id
          }
        }
      })
    }

    await PersonModel.bulkWrite(bulkOperations)
    await CivilizationModel.updateMany({}, { $pull: { people: { $in: deletedPeople } } })

    return 'DONE'
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

    // Un SEUL appel à .sort() : les appels chaînés se cumulent dans Mongoose, ce
    // qui mettait `_id` (unique) en clé primaire et rendait le tri demandé sans
    // effet visible. Ici le champ demandé est primaire et `_id` sert uniquement de
    // départage stable pour la pagination.
    // Directions NUMÉRIQUES homogènes (1/-1) : mélanger une valeur chaîne
    // ('asc'/'desc') et numérique (_id: 1) dans le même objet `.sort()` faisait
    // que Mongoose n'appliquait le tri que dans un seul sens.
    const sortDirection: 1 | -1 =
      sort?.order === 'desc' || sort?.order === 'descending' || sort?.order === -1 ? -1 : 1
    const rawPeopleRequest = PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).sort(
      sort?.field ? { [sort.field]: sortDirection, _id: 1 } : { _id: 1 },
    )

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

    for await (const rawPerson of cursor) {
      yield personMapper(rawPerson as unknown as PeopleType).formatToType()
    }
  }

  public async* getPeopleWithLineageStreamFromCivilization(civilizationId: string, batchSize: number) {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    const cursor = PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).batchSize(batchSize).cursor()

    for await (const rawPerson of cursor) {
      yield personMapper(rawPerson)
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

    const [men, women] = await Promise.all([
      PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).countDocuments({ gender: Gender.MALE }),
      PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).countDocuments({ gender: Gender.FEMALE }),
    ])
    return { men, women }
  }

  public async countPregnant(civilizationId: string): Promise<number> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    return PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).countDocuments({ child: { $ne: null } })
  }

  public async countChildren(civilizationId: string): Promise<number> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    return PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).countDocuments({ occupation: OccupationTypes.CHILD })
  }

  public async countCaptives(civilizationId: string): Promise<number> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    return PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).countDocuments({
      originCivilizationId: { $nin: [null, civilizationId] }
    })
  }

  // Pyramide des âges : effectifs hommes/femmes par tranche d'âge (en années).
  // Les tranches sont denses de 0 à la plus âgée, pour que le front puisse les
  // empiler telles quelles sans trous.
  public async getAgePyramid(
    civilizationId: string,
    yearsPerBucket = 5,
  ): Promise<{ from: number; to: number; men: number; women: number }[]> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }

    const grouped = await PersonModel.aggregate<{
      _id: { bucket: number; gender: Gender }
      count: number
    }>([
      { $match: { _id: { $in: civilization.people } } },
      {
        $group: {
          _id: {
            bucket: { $floor: { $divide: ['$month', 12 * yearsPerBucket] } },
            gender: '$gender',
          },
          count: { $sum: 1 },
        },
      },
    ])

    if (!grouped.length) {
      return []
    }

    const maxBucket = grouped.reduce((max, { _id }) => Math.max(max, _id.bucket), 0)
    const buckets = Array.from({ length: maxBucket + 1 }, (_, bucket) => ({
      from: bucket * yearsPerBucket,
      to: (bucket + 1) * yearsPerBucket - 1,
      men: 0,
      women: 0,
    }))
    for (const { _id, count } of grouped) {
      if (_id.gender === Gender.MALE) {
        buckets[_id.bucket].men = count
      } else {
        buckets[_id.bucket].women = count
      }
    }
    return buckets
  }

  public async countPeopleWithJob(civilizationId: string, occupation: OccupationTypes): Promise<number> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId, 'people')
    if (!civilization) {
      throw new Error(`No civilization found for ${civilizationId}`)
    }
    return PersonModel.find<PeopleType>({ _id: { $in: civilization.people } }).countDocuments({ occupation })
  }
}