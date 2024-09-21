import { BuildingType, BuildingTypes, Civilization, CivilizationBuilder, CivilizationType, Gender, House, PeopleBuilder, Resource, ResourceTypes } from '@ajustor/simulation'

import { CivilizationModel, PersonModel, UserModel, WorldModel } from '../../libs/database/models'

type MongoBuildingType = BuildingType & { buildingType: BuildingTypes }

type MongoCivilizationType = CivilizationType & { resources: { quantity: number, resourceType: ResourceTypes }[], buildings: MongoBuildingType[] }

const civilizationMapper = (civilization: MongoCivilizationType): Civilization => {
  const builder = new CivilizationBuilder()

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

  builder.addCitizen(...civilization.people.map(({ id, name, gender, month, lifeCounter, occupation, buildingMonthsLeft, isBuilding, pregnancyMonthsLeft, child, lineage }) => {
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
  }))

  return builder.withId(civilization.id).withLivedMonths(civilization.livedMonths).withName(civilization.name).build()
}


export type FieldsToRemove = {
  lineage?: boolean
}

export class CivilizationTable {
  constructor() {

  }

  async getAllByWorldId(worldId: string): Promise<Civilization[]> {
    const worldWithCivilizations = await WorldModel.findOne({ _id: worldId }).populate<{ civilizations: MongoCivilizationType[] }>({
      path: 'civilizations',
      populate: {
        path: 'people',
      }
    }).exec()

    if (!worldWithCivilizations?.civilizations?.length) {
      return []
    }

    return worldWithCivilizations.civilizations.map(civilizationMapper)
  }

  async getByIds(civilizationIds: string[]): Promise<Civilization[]> {
    const civilizations = await CivilizationModel.find<MongoCivilizationType>({ _id: { $in: civilizationIds } }).populate('people')

    return civilizations.map(civilizationMapper)
  }

  async getById(civilizationId: string): Promise<Civilization> {
    const civilization = await CivilizationModel.findById<MongoCivilizationType>(civilizationId).populate('people')

    if (!civilization) {
      throw new Error('It look like your civilization disapear')
    }

    return civilizationMapper(civilization)
  }

  async getAll(): Promise<Civilization[]> {
    const civilizations = await CivilizationModel.find<MongoCivilizationType>().populate('people')

    return civilizations.map(civilizationMapper)
  }

  async getByUserId(userId: string): Promise<Civilization[]> {
    const user = await UserModel.findOne({ _id: userId }).populate<{ civilizations: MongoCivilizationType[] }>(
      {
        path: 'civilizations',
        model: CivilizationModel,
        populate: {
          path: 'people',
          model: PersonModel
        }
      }
    )

    if (!user?.civilizations?.length) {
      return []
    }

    return user.civilizations.map(civilizationMapper)
  }

  async getByUserAndCivilizationId(userId: string, civilizationId: string): Promise<Civilization | undefined> {
    const user = await UserModel.findOne({ _id: userId }).populate<{ civilizations: MongoCivilizationType[] }>({
      path: 'civilizations',
      model: CivilizationModel,
      populate: {
        path: 'people',
        model: PersonModel
      }
    })

    const civilization = user?.civilizations.find(({ id }) => id === civilizationId)

    if (!civilization) {
      return undefined
    }

    return civilizationMapper(civilization)
  }


  async create(userId: string, civilization: Civilization) {
    const user = await UserModel.findOne({ _id: userId })
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

    user?.civilizations.push(newCivilization._id)
    user?.save()
    const world = await WorldModel.findOne()

    world?.civilizations.push(newCivilization._id)
    world?.save()
  }

  async saveAll(civilizations: Civilization[]) {
    await Promise.all(civilizations.map(async (civilization) => {
      const oldCivilization = await CivilizationModel.findOne({ _id: civilization.id })

      if (!oldCivilization) {
        throw new Error('Your civilization disapear from our data')
      }

      const alivePeople = oldCivilization.people.filter((id) => civilization.people.some(({ id: alivePeopleId }) => id.toString() === alivePeopleId))
      const deadPeople = oldCivilization.people.filter((id) => !alivePeople.includes(id))
      await PersonModel.deleteMany({ _id: { $in: deadPeople } })

      await Promise.all(civilization.people.map(async (person) => {
        if (!person.id) {
          const newPerson = await PersonModel.create(person.formatToEntity())
          alivePeople.push(newPerson._id)
        } else {
          await PersonModel.findOneAndUpdate({ _id: person.id }, person.formatToEntity())
        }
      }))

      await CivilizationModel.findOneAndUpdate({ _id: civilization.id }, {
        buildings: civilization.buildings.map(({ count, getType, capacity }) => ({ capacity, count, buildingType: getType() })),
        livedMonths: civilization.livedMonths,
        resources: civilization.resources.map(({ type, quantity }) => ({ resourceType: type, quantity })),
        people: alivePeople
      })
    }))
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