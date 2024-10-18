import { BuildingType, BuildingTypes, Civilization, CivilizationBuilder, CivilizationType, House, PeopleEntity, Resource, ResourceTypes } from '@ajustor/simulation'

import { CivilizationModel, PersonModel, UserModel, WorldModel } from '../../libs/database/models'
import { PeopleService, personMapper } from '../people/service'

type MongoBuildingType = BuildingType & { buildingType: BuildingTypes }

export type MongoCivilizationType = CivilizationType & { resources: { quantity: number, resourceType: ResourceTypes }[], buildings: MongoBuildingType[] }

export const civilizationMapper = (civilization: MongoCivilizationType, populate?: CivilizationPopulate): Civilization => {
  const builder = new CivilizationBuilder()
    .withId(civilization.id)
    .withLivedMonths(civilization.livedMonths)
    .withName(civilization.name)
    .withCitizensCount(civilization.people?.length ?? 0)

  for (const civilizationResource of civilization.resources) {
    const resource = new Resource(civilizationResource.resourceType, civilizationResource.quantity)
    builder.addResource(resource)
  }


  for (const building of civilization.buildings) {
    if (building.buildingType === BuildingTypes.HOUSE) {
      const house = new House(building.capacity ?? 0)
      house.count = building.count

      builder.addBuilding(house)
    }
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
  constructor(private readonly peopleService: PeopleService) {

  }

  async getAllByWorldId(worldId: string, populate?: CivilizationPopulate): Promise<Civilization[]> {
    const world = await WorldModel.findOne({ _id: worldId })

    if (!world) {
      return []
    }

    const civilizationsRequest = CivilizationModel.find<MongoCivilizationType>({ _id: { $in: world.civilizations } })

    if (populate?.people) {
      civilizationsRequest.populate<{ people: PeopleEntity }>('people')
    }

    const civilizations = await civilizationsRequest

    if (!civilizations?.length) {
      return []
    }

    return civilizations.map((civilization) => civilizationMapper(civilization, populate))
  }

  async getAllRawByWorldId(worldId: string, populate?: CivilizationPopulate): Promise<MongoCivilizationType[]> {
    const world = await WorldModel.findOne({ _id: worldId })

    if (!world) {
      return []
    }

    const civilizationsRequest = CivilizationModel.find<MongoCivilizationType>({ _id: { $in: world.civilizations } })

    if (populate?.people) {
      civilizationsRequest.populate<{ people: PeopleEntity }>('people')
    }

    const civilizations = await civilizationsRequest

    if (!civilizations?.length) {
      return []
    }

    return civilizations
  }

  async countGenderForWorld(worldId: string): Promise<{ men: number, women: number }> {
    const world = await WorldModel.findOne({ _id: worldId })

    if (!world) {
      return { men: 0, women: 0 }
    }

    const menAndWomen = { men: 0, women: 0 }

    for (const civilizationId of world.civilizations) {
      const { men, women } = await this.peopleService.countGenders(civilizationId.toString())
      menAndWomen.men += men
      menAndWomen.women += women
    }

    return menAndWomen
  }

  async getByIds(civilizationIds: string[], populate?: CivilizationPopulate): Promise<Civilization[]> {
    const civilizationRequest = CivilizationModel.find<MongoCivilizationType>({ _id: { $in: civilizationIds } })

    if (populate?.people) {
      civilizationRequest.populate('people')
    }

    const civilizations = await civilizationRequest

    return civilizations.map((civilization) => civilizationMapper(civilization, populate))
  }

  async getById(civilizationId: string): Promise<Civilization> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId).populate('people')

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

    return civilizations.map((civilization) => civilizationMapper(civilization, populate))
  }

  async getByUserId(userId: string, populate?: CivilizationPopulate): Promise<Civilization[]> {
    const user = await UserModel.findOne({ _id: userId })

    if (!user) {
      return []
    }

    const civilizationRequest = CivilizationModel.find<MongoCivilizationType>({ _id: { $in: user.civilizations } })

    if (populate?.people) {
      civilizationRequest.populate('people')
    }

    const civilizations = await civilizationRequest

    return civilizations.map((civilization) => civilizationMapper(civilization, populate))
  }

  async getByUserAndCivilizationId(userId: string, civilizationId: string, populate?: CivilizationPopulate): Promise<Civilization | undefined> {
    const user = await UserModel.findOne({ _id: userId })

    if (!user) {
      return
    }

    const civilizationRequest = CivilizationModel.findOne<MongoCivilizationType>({ _id: civilizationId })

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
      resources: civilization.resources.map(({ type, quantity }) => ({ resourceType: type, quantity })),
      people: newPeople
    })

    user.civilizations ??= []

    user.civilizations.push(newCivilization._id)
    user.save()
    world.civilizations ??= []
    world.civilizations.push(newCivilization._id)
    world.save()
  }

  async saveAll(civilizations: Civilization[]) {

    for (const civilization of civilizations) {
      console.log(`Saving civilization ${civilization.name}`)
      const oldCivilization = await CivilizationModel.findOne({ _id: civilization.id })

      if (!oldCivilization) {
        throw new Error('Your civilization disapear from our data')
      }

      console.log('Calculate dead/alive people')
      const alivePeople = oldCivilization.people.filter((id) => civilization.people.some(({ id: alivePeopleId }) => id.toString() === alivePeopleId))
      const deadPeople = oldCivilization.people.filter((id) => !alivePeople.includes(id))
      console.log('Deleting dead people')
      await PersonModel.deleteMany({ _id: { $in: deadPeople } })

      console.log(`Start saving alive people for civilization ${civilization.name}`)
      for (const person of civilization.people) {
        if (!person.id) {
          const newPerson = await PersonModel.create(person.formatToEntity())
          alivePeople.push(newPerson._id)
        } else {
          await PersonModel.findOneAndUpdate({ _id: person.id }, person.formatToEntity())
        }
      }
      console.log('People saved save civilization')

      await CivilizationModel.findOneAndUpdate({ _id: civilization.id }, {
        buildings: civilization.buildings.map(({ count, getType, capacity }) => ({ capacity, count, buildingType: getType() })),
        livedMonths: civilization.livedMonths,
        resources: civilization.resources.map(({ type, quantity }) => ({ resourceType: type, quantity })),
        people: alivePeople
      })
      console.log(`Civilization ${civilization.name} is saved`)
    }
  }

  async delete(userId: string, civilizationId: string) {
    const user = await UserModel.findOne({ _id: userId }).populate<{ civilizations: CivilizationType[] }>({
      path: 'civilizations',
      populate: {
        path: 'people',
      }
    })

    const civilizationToDelete = user?.civilizations.find(({ id }) => id === civilizationId)

    if (!user?.civilizations?.length || !civilizationToDelete) {
      throw new Error('No civilization found')
    }

    await CivilizationModel.deleteOne({ _id: civilizationToDelete.id })

  }

  async exist(civilizationName: string): Promise<boolean> {
    const exists = await CivilizationModel.exists({ name: civilizationName })

    return !!exists?._id
  }
}