import {
  type BuildingType,
  BuildingTypes,
  Civilization,
  CivilizationBuilder,
  type CivilizationConfig,
  type CivilizationType,
  House,
  type PeopleEntity,
  Resource,
  ResourceTypes,
  isExtractionBuilding,
  defaultCivilizationConfig,
  TechId,
  getTechNode,
} from '@ajustor/simulation'
import { Campfire, Farm, Kiln, Mine, Sawmill, Cache, Wall, Library } from '@ajustor/simulation'
import {
  CivilizationModel,
  CivilizationStatsModel,
  CombatLogModel,
  GraveModel,
  PersonModel,
  UserModel,
  WorldModel,
} from '../../libs/database/models'
import { computeRecap, emptyRecap, RECAP_MIN_MONTHS, type RecapData, type RecapStatsSnapshot, type RecapCombatLog } from './recap'
import { PeopleService, personMapper } from '../people/service'
import type { UpdateCivilizationDtoType } from './dto'
import type { ColonizeDtoType } from './colonize.dto'
import { type AnyBulkWriteOperation, Types } from 'mongoose'
import { arrayToMap } from '../../utils'
import { pushSender } from '../../libs/services/pushSender'

type MongoBuildingType = BuildingType & { buildingType: BuildingTypes }

const BUILDING_CONSTRUCTORS = {
  [BuildingTypes.FARM]: Farm,
  [BuildingTypes.CAMPFIRE]: Campfire,
  [BuildingTypes.KILN]: Kiln,
  [BuildingTypes.HOUSE]: House,
  [BuildingTypes.SAWMILL]: Sawmill,
  [BuildingTypes.MINE]: Mine,
  [BuildingTypes.CACHE]: Cache,
  [BuildingTypes.WALL]: Wall,
  [BuildingTypes.LIBRARY]: Library,
}

export type MongoCivilizationType = CivilizationType & {
  resources: { quantity: number; resourceType: ResourceTypes }[]
  buildings: MongoBuildingType[]
  worldId?: string | null
}

export const civilizationMapper = (
  civilization: MongoCivilizationType,
  populate?: CivilizationPopulate,
): Civilization => {
  const builder = new CivilizationBuilder()
    .withId(civilization.id)
    .withLivedMonths(civilization.livedMonths)
    .withResearchPoints((civilization as { researchPoints?: number }).researchPoints ?? 0)
    .withResearchedTechs(((civilization as { researchedTechs?: string[] }).researchedTechs ?? []) as TechId[])
    .withName(civilization.name)
    .withCitizensCount(civilization.people?.length ?? 0)

  if (civilization.config) {
    // Access each field explicitly rather than spreading the Mongoose subdocument,
    // which does not reliably enumerate virtual/getter-backed properties.
    const c = civilization.config
    builder.withConfig({
      PREGNANCY_PROBABILITY: c.PREGNANCY_PROBABILITY,
      MAX_ACTIVE_PEOPLE_BY_CIVILIZATION: c.MAX_ACTIVE_PEOPLE_BY_CIVILIZATION,
      PEOPLE_CHARCOAL_CAN_HEAT: c.PEOPLE_CHARCOAL_CAN_HEAT,
      CHANCE_TO_EVOLVE: c.CHANCE_TO_EVOLVE,
      CHANCE_TO_BUILD_EVOLVED_BUILDING: c.CHANCE_TO_BUILD_EVOLVED_BUILDING,
      // Fallback for civilizations saved before the percentage migration, whose
      // stored config has no MAXIMUM_CHILDREN_PERCENTAGE yet.
      MAXIMUM_CHILDREN_PERCENTAGE:
        c.MAXIMUM_CHILDREN_PERCENTAGE ??
        defaultCivilizationConfig.MAXIMUM_CHILDREN_PERCENTAGE,
      // OPEN_EXCHANGE and AT_WAR_WITH are stored as ObjectId refs
      OPEN_EXCHANGE: (c.OPEN_EXCHANGE ?? []).map(String),
      AT_WAR_WITH: (c.AT_WAR_WITH ?? []).map(String),
      MILITARY_RATIO: c.MILITARY_RATIO ?? 0,
      NEXT_BUILDING_TO_BUILD: c.NEXT_BUILDING_TO_BUILD ?? null,
      SPEED_MODE: c.SPEED_MODE ?? defaultCivilizationConfig.SPEED_MODE,
    })
  }

  if (civilization.pendingConstructions?.length) {
    builder.withPendingConstructions(
      civilization.pendingConstructions.map(({ buildingType, monthsRemaining }) => ({
        buildingType,
        monthsRemaining,
      })),
    )
  }

  for (const civilizationResource of civilization.resources) {
    const resource = new Resource(
      civilizationResource.resourceType,
      civilizationResource.quantity,
    )
    builder.addResource(resource)
  }

  for (const building of civilization.buildings) {
    const buildingInstance = new BUILDING_CONSTRUCTORS[building.buildingType](
      building.count,
    )

    if (isExtractionBuilding(buildingInstance) && building.outputResources) {
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

  async getWorldId(civilizationId: string): Promise<string | null> {
    const civ = await CivilizationModel.findById(civilizationId, 'worldId')
    if (civ?.worldId) {
      return civ.worldId.toString()
    }
    // Fallback for existing civs that predate the worldId field: reverse lookup + lazy backfill
    const world = await WorldModel.findOne({ civilizations: civilizationId }, '_id')
    if (world) {
      await CivilizationModel.updateOne({ _id: civilizationId }, { worldId: world._id })
      return world._id.toString()
    }
    return null
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

  async create(userId: string, civilization: Civilization, worldId?: string) {
    const user = await UserModel.findOne({ _id: userId })
    const world = worldId
      ? await WorldModel.findById(worldId)
      : await WorldModel.findOne()
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
      buildings: civilization.buildings.map((building) => ({
        ...building.formatToType(),
        buildingType: building.getType(),
      })),
      worldId: world._id,
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
        // Only the people id list is needed to detect who died, no need to
        // load the whole civilization document.
        const oldCivilization = await CivilizationModel.findOne(
          { _id: civilization.id },
          'people',
        )

        if (!oldCivilization) {
          throw new Error('Your civilization disapear from our data')
        }

        // console.timeLog(civilization.name, 'Calculate dead/alive people')
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

        // console.timeLog(
        //   civilization.name,
        //   'Deleting dead people and update people',
        // )

        const bulkResult = await PersonModel.bulkWrite(bulkWriteOperations)
        for (const id of Object.values(bulkResult.insertedIds)) {
          alivePeople.add(id)
        }

        // console.timeLog(
        //   civilization.name,
        //   `Start saving new people for civilization`,
        // )
        // console.timeLog(civilization.name, 'People saved save civilization')

        await CivilizationModel.findOneAndUpdate(
          { _id: civilization.id },
          {
            buildings: civilization.buildings.map((building) => ({
              ...building.formatToType(),
              buildingType: building.getType(),
            })),
            livedMonths: civilization.livedMonths,
            researchPoints: civilization.researchPoints,
            researchedTechs: civilization.researchedTechs,
            pendingConstructions: civilization.pendingConstructions,
            resources: civilization.resources.map(({ type, quantity }) => ({
              resourceType: type,
              quantity,
            })),
            people: [...alivePeople],
            // Persist the simulation-modified config field so that the next
            // monthly tick doesn't re-read a stale NEXT_BUILDING_TO_BUILD
            // from the DB and re-queue the same building.
            'config.NEXT_BUILDING_TO_BUILD': civilization.config.NEXT_BUILDING_TO_BUILD,
          },
        )
        // console.timeEnd(civilization.name)
      }),
    )
  }

  async delete(userId: string, civilizationId: string) {
    const user = await UserModel.findOne({ _id: userId }).populate<{
      civilizations: CivilizationType[]
    }>({
      path: 'civilizations',
    })

    const civilizationToDelete = user?.civilizations.find(
      ({ id }) => id === civilizationId,
    )

    if (!user?.civilizations?.length || !civilizationToDelete) {
      throw new Error('No civilization found')
    }

    await PersonModel.deleteMany({ _id: { $in: civilizationToDelete.people } })
    await CivilizationStatsModel.deleteMany({ civilizationId })
    await GraveModel.deleteMany({ civilizationId })
    await CivilizationModel.deleteOne({ _id: civilizationToDelete.id })
  }

  async exist(civilizationName: string): Promise<boolean> {
    const exists = await CivilizationModel.exists({ name: civilizationName })

    return !!exists?._id
  }

  async colonize(userId: string, civilizationId: string, body: ColonizeDtoType) {
    // 1. Vérifier que l'utilisateur possède cette civ
    const user = await UserModel.findOne({ _id: userId })
    if (!user?.civilizations.map(String).includes(civilizationId)) {
      throw new Error('Civilization not found')
    }

    // 2. Charger le document MongoDB de la civ (sans peupler les gens)
    const mongoCiv = await CivilizationModel.findById<MongoCivilizationType>(civilizationId)
    if (!mongoCiv) throw new Error('Civilization not found')

    // 3. Vérifier la tech COLONISATION
    if (!(mongoCiv.researchedTechs ?? []).includes(TechId.COLONIZATION)) {
      throw new Error('Colonization technology required')
    }

    // 4. Valider la population
    const civPeople = (mongoCiv.people ?? []) as { toString(): string }[]
    const totalPeople = civPeople.length
    const transferCount = Math.floor(totalPeople * body.populationPercent / 100)
    if (transferCount < 1) throw new Error('Not enough people to transfer')
    if (totalPeople - transferCount < 10) {
      throw new Error('Mother civilization must keep at least 10 people')
    }

    // Aggregate resource transfers by type to prevent duplicate bypass
    const resourceTransferMap = new Map<string, number>()
    for (const transfer of body.resources) {
      if (transfer.amount <= 0) continue
      resourceTransferMap.set(transfer.type, (resourceTransferMap.get(transfer.type) ?? 0) + transfer.amount)
    }
    const aggregatedTransfers = Array.from(resourceTransferMap.entries()).map(([type, amount]) => ({ type, amount }))

    // 5. Valider les ressources
    const civResources = mongoCiv.resources as { resourceType: ResourceTypes; quantity: number }[]
    for (const transfer of aggregatedTransfers) {
      if (transfer.amount <= 0) continue
      const existing = civResources.find((r) => r.resourceType === transfer.type)
      if ((existing?.quantity ?? 0) < transfer.amount) {
        throw new Error(`Insufficient ${transfer.type}`)
      }
    }

    // 6. Vérifier l'unicité du nom
    if (await this.exist(body.colonyName)) {
      throw new Error('A civilization with that name already exists')
    }

    // 7. Mélanger et répartir les IDs de citoyens
    const allIds = civPeople.map((id) => id.toString())
    const shuffled = [...allIds].sort(() => Math.random() - 0.5)
    const colonyPeopleIds = shuffled.slice(0, transferCount)
    const motherPeopleIds = shuffled.slice(transferCount)

    // 8. Calculer les nouveaux stocks de ressources
    const motherResources = civResources.map((r) => ({
      resourceType: r.resourceType,
      quantity: r.quantity,
    }))
    const colonyResources: { resourceType: ResourceTypes; quantity: number }[] = []

    for (const transfer of aggregatedTransfers) {
      if (transfer.amount <= 0) continue
      const idx = motherResources.findIndex((r) => r.resourceType === transfer.type)
      if (idx === -1) continue
      motherResources[idx].quantity -= transfer.amount
      const existing = colonyResources.find((r) => r.resourceType === transfer.type)
      if (existing) {
        existing.quantity += transfer.amount
      } else {
        colonyResources.push({ resourceType: transfer.type as ResourceTypes, quantity: transfer.amount })
      }
    }

    // 9. Créer la colonie
    const currentOpenExchange = (mongoCiv.config?.OPEN_EXCHANGE ?? []).map(String)
    const colonyDoc = await CivilizationModel.create({
      name: body.colonyName,
      livedMonths: 0,
      researchPoints: 0,
      researchedTechs: body.techs,
      buildings: [],
      people: colonyPeopleIds,
      resources: colonyResources,
      worldId: mongoCiv.worldId,
      config: {
        ...defaultCivilizationConfig,
        OPEN_EXCHANGE: [civilizationId],
        AT_WAR_WITH: [],
      },
    })

    // 10. Mettre à jour la mère
    await CivilizationModel.findByIdAndUpdate(civilizationId, {
      people: motherPeopleIds,
      resources: motherResources,
      'config.OPEN_EXCHANGE': [...currentOpenExchange, colonyDoc._id.toString()],
    })

    // 11. Ajouter la colonie au monde
    await WorldModel.findByIdAndUpdate(mongoCiv.worldId, {
      $push: { civilizations: colonyDoc._id },
    })

    // 12. Rattacher la colonie au compte utilisateur
    await UserModel.findByIdAndUpdate(userId, {
      $push: { civilizations: colonyDoc._id },
    })

    return { motherId: civilizationId, colonyId: colonyDoc._id.toString() }
  }

  async reclaimResources(
    userId: string,
    civilizationId: string,
    targetCivilizationId: string,
  ) {
    // 1. Les deux civilisations doivent appartenir au joueur.
    const user = await UserModel.findOne({ _id: userId })
    const ownedIds = (user?.civilizations ?? []).map(String)
    if (!ownedIds.includes(civilizationId)) {
      throw new Error('Civilization not found')
    }
    if (!ownedIds.includes(targetCivilizationId)) {
      throw new Error('Target civilization not found')
    }
    if (civilizationId === targetCivilizationId) {
      throw new Error('A civilization cannot reclaim its own resources')
    }

    // 2. Charger les deux documents.
    const [receiver, target] = await Promise.all([
      CivilizationModel.findById<MongoCivilizationType>(civilizationId),
      CivilizationModel.findById<MongoCivilizationType>(targetCivilizationId),
    ])
    if (!receiver) throw new Error('Civilization not found')
    if (!target) throw new Error('Target civilization not found')

    // 3. On ne récupère les ressources que d'une civilisation abandonnée,
    // c'est-à-dire dont plus personne n'est habitant.
    if ((target.people?.length ?? 0) > 0) {
      throw new Error('The target civilization still has inhabitants')
    }

    // 4. Fusionner les ressources de la cible dans la civilisation réceptrice.
    const receiverResources = (
      receiver.resources as { resourceType: ResourceTypes; quantity: number }[]
    ).map((r) => ({ resourceType: r.resourceType, quantity: r.quantity }))
    const reclaimedResources: { resourceType: ResourceTypes; quantity: number }[] = []

    for (const resource of target.resources as {
      resourceType: ResourceTypes
      quantity: number
    }[]) {
      if (resource.quantity <= 0) continue
      reclaimedResources.push({
        resourceType: resource.resourceType,
        quantity: resource.quantity,
      })
      const existing = receiverResources.find(
        (r) => r.resourceType === resource.resourceType,
      )
      if (existing) {
        existing.quantity += resource.quantity
      } else {
        receiverResources.push({
          resourceType: resource.resourceType,
          quantity: resource.quantity,
        })
      }
    }

    // 5. Sauver la civilisation réceptrice avec ses nouvelles ressources.
    await CivilizationModel.updateOne(
      { _id: civilizationId },
      { resources: receiverResources },
    )

    // 6. Supprimer la civilisation abandonnée. Le hook `deleteOne` du schéma
    // retire déjà la référence du monde et du joueur ; on nettoie en plus ses
    // statistiques et son cimetière, comme le fait `delete`.
    await CivilizationStatsModel.deleteMany({ civilizationId: targetCivilizationId })
    await GraveModel.deleteMany({ civilizationId: targetCivilizationId })
    await CivilizationModel.deleteOne({ _id: targetCivilizationId })

    // 7. Nettoyer les références éventuelles vers la civilisation supprimée dans
    // la configuration des autres civilisations (échanges ouverts, guerres) afin
    // de ne pas laisser de liens fantômes (ex. une colonie issue de `colonize`).
    await CivilizationModel.updateMany(
      {
        $or: [
          { 'config.OPEN_EXCHANGE': targetCivilizationId },
          { 'config.AT_WAR_WITH': targetCivilizationId },
        ],
      },
      {
        $pull: {
          'config.OPEN_EXCHANGE': targetCivilizationId,
          'config.AT_WAR_WITH': targetCivilizationId,
        },
      },
    )

    return {
      receiverId: civilizationId,
      targetId: targetCivilizationId,
      reclaimedResources: reclaimedResources.map(({ resourceType, quantity }) => ({
        type: resourceType,
        amount: quantity,
      })),
    }
  }

  async update(userId: string, civilizationId: string, body: UpdateCivilizationDtoType) {
    const user = await UserModel.findOne({ _id: userId }).populate<{
      civilizations: CivilizationType[]
    }>({
      path: 'civilizations',
    })

    const civilizationToUpdate = user?.civilizations.find(
      ({ id }) => id === civilizationId,
    )

    if (!user?.civilizations?.length || !civilizationToUpdate) {
      throw new Error('No civilization found')
    }

    // The DTO exposes camelCase fields, while the stored config uses
    // UPPER_SNAKE_CASE keys, so we map them explicitly. Each field falls back to
    // its current value (or the default for civilizations created before the
    // config existed), and only the fields present in the body override it.
    const currentConfig = civilizationToUpdate.config ?? defaultCivilizationConfig

    await CivilizationModel.findOneAndUpdate(
      { _id: civilizationToUpdate.id },
      {
        config: {
          PREGNANCY_PROBABILITY:
            currentConfig.PREGNANCY_PROBABILITY ??
            defaultCivilizationConfig.PREGNANCY_PROBABILITY,
          PEOPLE_CHARCOAL_CAN_HEAT:
            currentConfig.PEOPLE_CHARCOAL_CAN_HEAT ??
            defaultCivilizationConfig.PEOPLE_CHARCOAL_CAN_HEAT,
          CHANCE_TO_EVOLVE:
            currentConfig.CHANCE_TO_EVOLVE ??
            defaultCivilizationConfig.CHANCE_TO_EVOLVE,
          CHANCE_TO_BUILD_EVOLVED_BUILDING:
            currentConfig.CHANCE_TO_BUILD_EVOLVED_BUILDING ??
            defaultCivilizationConfig.CHANCE_TO_BUILD_EVOLVED_BUILDING,
          MAXIMUM_CHILDREN_PERCENTAGE:
            body.maximumChildrenPercentage ??
            currentConfig.MAXIMUM_CHILDREN_PERCENTAGE ??
            defaultCivilizationConfig.MAXIMUM_CHILDREN_PERCENTAGE,
          MAX_ACTIVE_PEOPLE_BY_CIVILIZATION:
            body.maxActivePeopleByCivilization ??
            currentConfig.MAX_ACTIVE_PEOPLE_BY_CIVILIZATION ??
            defaultCivilizationConfig.MAX_ACTIVE_PEOPLE_BY_CIVILIZATION,
          OPEN_EXCHANGE:
            body.openExchange ??
            currentConfig.OPEN_EXCHANGE ??
            defaultCivilizationConfig.OPEN_EXCHANGE,
          MILITARY_RATIO:
            body.militaryRatio ??
            currentConfig.MILITARY_RATIO ??
            defaultCivilizationConfig.MILITARY_RATIO,
          NEXT_BUILDING_TO_BUILD:
            body.nextBuildingToBuild !== undefined
              ? (body.nextBuildingToBuild as CivilizationConfig['NEXT_BUILDING_TO_BUILD'])
              : (currentConfig.NEXT_BUILDING_TO_BUILD ??
                defaultCivilizationConfig.NEXT_BUILDING_TO_BUILD),
          AT_WAR_WITH:
            body.atWarWith ??
            currentConfig.AT_WAR_WITH ??
            defaultCivilizationConfig.AT_WAR_WITH,
          SPEED_MODE:
            body.speedMode ??
            currentConfig.SPEED_MODE ??
            defaultCivilizationConfig.SPEED_MODE,
        },
      },
    )

    // Warn the owners of newly targeted civilizations that a war was just
    // declared against them, so they can react (walls, military ratio) before
    // the attack resolves on the next month. Best-effort: never fails the update.
    if (body.atWarWith) {
      const previousTargets = new Set(
        (currentConfig.AT_WAR_WITH ?? []).map(String),
      )
      const newTargets = body.atWarWith.filter(
        (targetId) => !previousTargets.has(String(targetId)),
      )
      if (newTargets.length) {
        await this.notifyWarTargets(
          civilizationToUpdate.name,
          civilizationToUpdate.id,
          newTargets,
        ).catch((error) =>
          console.error('[CivilizationService] Failed to notify war targets', error),
        )
      }
    }
  }

  /**
   * Sends a push notification to the owner of each newly attacked civilization.
   * Skips civilizations owned by the attacker (e.g. attacking your own second
   * civilization).
   */
  private async notifyWarTargets(
    attackerName: string,
    attackerCivId: string,
    targetCivIds: string[],
  ): Promise<void> {
    await Promise.all(
      targetCivIds.map(async (targetCivId) => {
        const [targetCiv, owner] = await Promise.all([
          CivilizationModel.findById(targetCivId, { name: 1 }).lean(),
          UserModel.findOne(
            { civilizations: targetCivId },
            { _id: 1, civilizations: 1 },
          ).lean(),
        ])

        if (!targetCiv || !owner) {
          return
        }

        // Don't notify a player about attacking their own civilization.
        if (owner.civilizations?.map(String).includes(String(attackerCivId))) {
          return
        }

        await pushSender.sendToUser(String(owner._id), {
          title: '⚔️ Attaque imminente !',
          body: `${attackerName} a déclaré la guerre à ${targetCiv.name}. Préparez vos défenses !`,
          url: `/my-civilizations/${targetCivId}`,
        })
      }),
    )
  }

  async getCivilizationStats(civilizationId: string, limit: number = 10) {
    const result = await CivilizationStatsModel.find({ civilizationId })
      .sort('-month')
      .limit(limit)
      .lean()
    return result.reverse()
  }

  async getCombatLogs(civilizationId: string, limit = 20, offset = 0) {
    return CombatLogModel.find({ civilizationId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
  }

  async getGraves(civilizationId: string, limit = 20, offset = 0) {
    return GraveModel.find({ civilizationId }, 'name cause month')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
  }

  async getDeathCauseCounts(civilizationId: string): Promise<Record<string, number>> {
    const grouped = await GraveModel.aggregate<{ _id: string; count: number }>([
      { $match: { civilizationId: new Types.ObjectId(civilizationId) } },
      { $group: { _id: '$cause', count: { $sum: 1 } } },
    ])
    return Object.fromEntries(grouped.map(({ _id, count }) => [_id, count]))
  }

  async markCombatLogsViewed(civilizationId: string): Promise<void> {
    await CivilizationModel.updateOne(
      { _id: civilizationId },
      { lastViewedCombats: new Date() },
    )
  }

  async getRecentAttacksCount(civilizationId: string): Promise<number> {
    const civ = await CivilizationModel.findById(civilizationId, {
      lastViewedCombats: 1,
    }).lean()

    const filter: Record<string, unknown> = {
      civilizationId,
      role: 'defender',
      attackerWins: true,
    }

    if (civ?.lastViewedCombats) {
      filter.createdAt = { $gt: civ.lastViewedCombats }
    }

    return CombatLogModel.countDocuments(filter)
  }

  async getRecap(userId: string, civilizationId: string): Promise<RecapData> {
    const user = await UserModel.findOne({ _id: userId }).populate<{
      civilizations: (CivilizationType & { livedMonths: number; lastSeenMonth?: number | null })[]
    }>({ path: 'civilizations' })

    const civilization = user?.civilizations.find(({ id }) => id === civilizationId)
    if (!user || !civilization) {
      throw new Error('No civilization found')
    }

    const toMonth = civilization.livedMonths
    const fromMonth = civilization.lastSeenMonth

    // Première visite : on pose la référence, pas de récap.
    if (fromMonth === null || fromMonth === undefined) {
      await CivilizationModel.updateOne({ _id: civilizationId }, { lastSeenMonth: toMonth })
      return emptyRecap()
    }
    if (toMonth <= fromMonth) {
      return emptyRecap()
    }
    // Absence trop courte (un seul mois écoulé) : pas de récap. On n'avance pas
    // la référence pour laisser la période s'accumuler jusqu'à la prochaine
    // visite, afin de ne pas perdre ce mois si une vraie absence suit.
    if (toMonth - fromMonth < RECAP_MIN_MONTHS) {
      return emptyRecap()
    }

    const allStats = (await CivilizationStatsModel.find({ civilizationId })
      .sort('month')
      .lean()) as unknown as RecapStatsSnapshot[]
    const baseline = [...allStats].reverse().find((snapshot) => snapshot.month <= fromMonth) ?? null
    const current = allStats[allStats.length - 1] ?? null
    const periodSnapshots = allStats.filter(
      (snapshot) => snapshot.month > fromMonth && snapshot.month <= toMonth,
    )

    const combats = (await CombatLogModel.find({
      civilizationId,
      month: { $gt: fromMonth, $lte: toMonth },
    }).lean()) as unknown as RecapCombatLog[]

    const recap = computeRecap({ fromMonth, toMonth, baseline, current, periodSnapshots, combats })

    await CivilizationModel.updateOne({ _id: civilizationId }, { lastSeenMonth: toMonth })
    return recap
  }

  async unlockTech(userId: string, civilizationId: string, techId: string) {
    const user = await UserModel.findOne({ _id: userId }).populate<{
      civilizations: (CivilizationType & { researchPoints?: number; researchedTechs?: string[] })[]
    }>({ path: 'civilizations' })
    const civilization = user?.civilizations.find(({ id }) => id === civilizationId)
    if (!user || !civilization) {
      throw new Error('No civilization found')
    }

    const node = getTechNode(techId as TechId)
    if (!node) {
      throw new Error('Unknown technology')
    }

    const researched = civilization.researchedTechs ?? []
    if (researched.includes(techId)) {
      throw new Error('Technology already researched')
    }
    if (!node.prerequisites.every((pre) => researched.includes(pre))) {
      throw new Error('Prerequisites not met')
    }
    const points = civilization.researchPoints ?? 0
    if (points < node.cost) {
      throw new Error('Not enough research points')
    }

    await CivilizationModel.updateOne(
      { _id: civilizationId },
      {
        researchPoints: points - node.cost,
        researchedTechs: [...researched, techId],
      },
    )
    return { researchPoints: points - node.cost, researchedTechs: [...researched, techId] }
  }
}
