import {
  BuildingType,
  BuildingTypes,
  Civilization,
  CivilizationBuilder,
  CivilizationType,
  House,
  PeopleEntity,
  Resource,
  ResourceTypes,
} from '@ajustor/simulation'

import {
  CivilizationModel,
  CivilizationStatsModel,
  PersonModel,
  UserModel,
  WorldModel,
} from '../../libs/database/models'
import { PeopleService, personMapper } from '../people/service'
import { arrayToMap } from '../../utils'
import { AnyBulkWriteOperation } from 'mongoose'
import { Farm } from '@ajustor/simulation/src/buildings/farm'
import { Kiln } from '@ajustor/simulation/src/buildings/kiln'
import { Mine } from '@ajustor/simulation/src/buildings/mine'
import { Sawmill } from '@ajustor/simulation/src/buildings/sawmill'
import { AbstractExtractionBuilding } from '@ajustor/simulation/src/types/building'

type MongoBuildingType = BuildingType & { buildingType: BuildingTypes }

const BUILDING_CONSTRUCTORS = {
  [BuildingTypes.FARM]: Farm,
  [BuildingTypes.KILN]: Kiln,
  [BuildingTypes.HOUSE]: House,
  [BuildingTypes.SAWMILL]: Sawmill,
  [BuildingTypes.MINE]: Mine,
}

export type MongoCivilizationType = CivilizationType & {
  resources: { quantity: number; resourceType: ResourceTypes }[]
  buildings: MongoBuildingType[]
}

export const civilizationMapper = (
  civilization: MongoCivilizationType,
  populate?: CivilizationPopulate,
): Civilization => {
  const builder = new CivilizationBuilder()
    .withId(civilization.id)
    .withLivedMonths(civilization.livedMonths)
    .withName(civilization.name)
    .withCitizensCount(civilization.people?.length ?? 0)

  for (const civilizationResource of civilization.resources) {
    const resource = new Resource(
      civilizationResource.resourceType,
      civilizationResource.quantity,
    )
    builder.addResource(resource)
  }

  for (const building of civilization.buildings) {
    const buildingInstance = new BUILDING_CONSTRUCTORS[building.buildingType](building.count ?? 1)

    if (buildingInstance instanceof AbstractExtractionBuilding && building.outputResources) {
      buildingInstance.outputResources = building.outputResources
      buildingInstance.capacity = building.capacity ?? 0
    }

    builder.addBuilding(buildingInstance)
  }

  if (populate?.people && civilization.people) {
    for (const person of civilization.people) {
      builder.addCitizen(personMapper(person))
    }
  }

  return builder.build()
}

export type CivilizationPopulate = {
  people: boolean
}

export class CivilizationService {
  constructor(private readonly peopleService: PeopleService) { }

  async getAliveByWorldId(
    worldId: string,
    populate?: CivilizationPopulate,
  ): Promise<Civilization[]> {
    const world = await WorldModel.findOne({ _id: worldId }, 'civilizations')

    if (!world) {
      return []
    }

    const civilizations = await CivilizationModel.find<MongoCivilizationType>(
      {
        $and: [
          { _id: { $in: world.civilizations } },
          { people: { $not: { $size: 0 } } },
        ],
      },
      '-people',
    )

    if (!civilizations?.length) {
      return []
    }

    return Promise.all(
      civilizations.map(async (rawCivilization) => {
        const civilization = civilizationMapper(rawCivilization, populate)
        if (!populate?.people) {
          return civilization
        }

        const peoplesOfCivilization =
          this.peopleService.getPeopleWithLineageStreamFromCivilization(
            civilization.id,
            1000,
          )

        for await (const peopleOfCivilization of peoplesOfCivilization) {
          civilization.people ??= []
          civilization.people.push(peopleOfCivilization)
        }

        return civilization
      }),
    )
  }

  async getAllByWorldId(
    worldId: string,
    populate?: CivilizationPopulate,
  ): Promise<Civilization[]> {
    const world = await WorldModel.findOne({ _id: worldId }, 'civilizations')

    if (!world) {
      return []
    }

    const civilizations = await CivilizationModel.find<MongoCivilizationType>(
      { _id: { $in: world.civilizations } },
      '-people',
    )

    if (!civilizations?.length) {
      return []
    }

    return Promise.all(
      civilizations.map(async (rawCivilization) => {
        const civilization = civilizationMapper(rawCivilization, populate)
        if (!populate?.people) {
          return civilization
        }

        const peoplesOfCivilization =
          this.peopleService.getPeopleWithLineageStreamFromCivilization(
            civilization.id,
            1000,
          )

        for await (const peopleOfCivilization of peoplesOfCivilization) {
          civilization.people ??= []
          civilization.people.push(peopleOfCivilization)
        }

        return civilization
      }),
    )
  }

  async getAllRawByWorldId(
    worldId: string,
    populate?: CivilizationPopulate,
  ): Promise<MongoCivilizationType[]> {
    const world = await WorldModel.findOne({ _id: worldId })

    if (!world) {
      return []
    }

    const civilizationsRequest = CivilizationModel.find<MongoCivilizationType>({
      _id: { $in: world.civilizations },
    })

    if (populate?.people) {
      civilizationsRequest.populate<{ people: PeopleEntity }>('people')
    }

    const civilizations = await civilizationsRequest

    if (!civilizations?.length) {
      return []
    }

    return civilizations
  }

  async countGenderForWorld(
    worldId: string,
  ): Promise<{ men: number; women: number }> {
    const world = await WorldModel.findOne({ _id: worldId })

    if (!world) {
      return { men: 0, women: 0 }
    }

    const menAndWomen = { men: 0, women: 0 }
    await Promise.all(
      world.civilizations.map(async (civilizationId) => {
        const { men, women } = await this.peopleService.countGenders(
          civilizationId.toString(),
        )
        menAndWomen.men += men
        menAndWomen.women += women
      }),
    )

    return menAndWomen
  }

  async getByIds(
    civilizationIds: string[],
    populate?: CivilizationPopulate,
  ): Promise<Civilization[]> {
    const civilizationRequest = CivilizationModel.find<MongoCivilizationType>({
      _id: { $in: civilizationIds },
    })

    if (populate?.people) {
      civilizationRequest.populate('people')
    }

    const civilizations = await civilizationRequest

    return civilizations.map((civilization) =>
      civilizationMapper(civilization, populate),
    )
  }

  async getById(civilizationId: string): Promise<Civilization> {
    const civilization =
      await CivilizationModel.findById<MongoCivilizationType>(
        civilizationId,
      ).populate('people')

    if (!civilization) {
      throw new Error('It look like your civilization disapear')
    }

    return civilizationMapper(civilization, { people: true })
  }

  async getAll(populate?: CivilizationPopulate): Promise<Civilization[]> {
    const civilizationsRequest = CivilizationModel.find<MongoCivilizationType>()

    if (populate?.people) {
      civilizationsRequest.populate('people')
    }

    const civilizations = await civilizationsRequest

    return civilizations.map((civilization) =>
      civilizationMapper(civilization, populate),
    )
  }

  async getByUserId(
    userId: string,
    populate?: CivilizationPopulate,
  ): Promise<Civilization[]> {
    const user = await UserModel.findOne({ _id: userId })

    if (!user) {
      return []
    }

    const civilizationRequest = CivilizationModel.find<MongoCivilizationType>({
      _id: { $in: user.civilizations },
    })

    if (populate?.people) {
      civilizationRequest.populate('people')
    }

    const civilizations = await civilizationRequest

    return civilizations.map((civilization) =>
      civilizationMapper(civilization, populate),
    )
  }

  async getByUserAndCivilizationId(
    userId: string,
    civilizationId: string,
    populate?: CivilizationPopulate,
  ): Promise<Civilization | undefined> {
    const user = await UserModel.findOne({ _id: userId })

    if (!user) {
      return
    }

    const civilizationRequest =
      CivilizationModel.findOne<MongoCivilizationType>({ _id: civilizationId })

    if (populate?.people) {
      civilizationRequest.populate('people')
    }

    const civilization = await civilizationRequest

    if (!civilization) {
      return
    }

    return civilizationMapper(civilization, populate)
  }

  async create(userId: string, civilization: Civilization) {
    const user = await UserModel.findOne({ _id: userId })
    const world = await WorldModel.findOne()
    if (!user) {
      throw new Error('No user found for this id')
    }
    if (!world) {
      throw new Error('No world exist in the simulation')
    }
    const newPeople = []
    for (const person of civilization.people) {
      const newPerson = await PersonModel.create(person.formatToEntity())
      newPeople.push(newPerson._id)
    }
    const newCivilization = await CivilizationModel.create({
      ...civilization,
      resources: civilization.resources.map(({ type, quantity }) => ({
        resourceType: type,
        quantity,
      })),
      people: newPeople,
      buildings: civilization.buildings.map((building) => building.formatToType())
    })

    user.civilizations ??= []

    user.civilizations.push(newCivilization._id)
    user.save()
    world.civilizations ??= []
    world.civilizations.push(newCivilization._id)
    world.save()
  }

  async saveAll(civilizations: Civilization[]) {
    await Promise.all(
      civilizations.map(async (civilization) => {
        const bulkWriteOperations: AnyBulkWriteOperation<PeopleEntity>[] = []
        console.time(civilization.name)
        console.timeLog(civilization.name, `Saving civilization`)
        const oldCivilization = await CivilizationModel.findOne({
          _id: civilization.id,
        })

        if (!oldCivilization) {
          throw new Error('Your civilization disapear from our data')
        }

        console.timeLog(civilization.name, 'Calculate dead/alive people')
        const alivePeople = new Set<string>()
        for (const people of civilization.people) {
          if (!people) {
            continue
          }
          if (people.id) {
            bulkWriteOperations.push({
              updateOne: {
                filter: {
                  _id: people.id,
                },
                update: people.formatToEntity(),
              },
            })
            alivePeople.add(people.id)
          } else {
            bulkWriteOperations.push({
              insertOne: {
                document: people.formatToEntity(),
              },
            })
          }
        }

        const peopleIndexedById = arrayToMap(
          civilization.people,
          ({ id }) => id,
        )

        for (const person of oldCivilization.people) {
          const isAlive = peopleIndexedById.has(person.toString())
          if (!isAlive) {
            bulkWriteOperations.push({
              deleteOne: {
                filter: {
                  _id: person,
                },
              },
            })
          }
        }

        console.timeLog(
          civilization.name,
          'Deleting dead people and update people',
        )

        const bulkResult = await PersonModel.bulkWrite(bulkWriteOperations)
        for (const id of Object.values(bulkResult.insertedIds)) {
          alivePeople.add(id)
        }

        console.timeLog(
          civilization.name,
          `Start saving new people for civilization`,
        )
        console.timeLog(civilization.name, 'People saved save civilization')

        await CivilizationModel.findOneAndUpdate(
          { _id: civilization.id },
          {
            buildings: civilization.buildings.map(
              (building) => ({
                ...building.formatToType(),
                buildingType: building.getType(),
              }),
            ),
            livedMonths: civilization.livedMonths,
            resources: civilization.resources.map(({ type, quantity }) => ({
              resourceType: type,
              quantity,
            })),
            people: [...alivePeople],
          },
        )
        console.timeEnd(civilization.name)
      }),
    )
  }

  async delete(userId: string, civilizationId: string) {
    const user = await UserModel.findOne({ _id: userId }).populate<{
      civilizations: CivilizationType[]
    }>({
      path: 'civilizations',
      populate: {
        path: 'people',
      },
    })

    const civilizationToDelete = user?.civilizations.find(
      ({ id }) => id === civilizationId,
    )

    if (!user?.civilizations?.length || !civilizationToDelete) {
      throw new Error('No civilization found')
    }

    await CivilizationModel.deleteOne({ _id: civilizationToDelete.id })
  }

  async exist(civilizationName: string): Promise<boolean> {
    const exists = await CivilizationModel.exists({ name: civilizationName })

    return !!exists?._id
  }

  async getCivilizationStats(civilizationId: string, limit: number = 10) {
    const result = await CivilizationStatsModel.find({ civilizationId })
      .sort('-month')
      .limit(limit)
      .lean()
    return result.reverse()
  }
}
