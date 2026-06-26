import {
  BuildingType,
  BuildingTypes,
  Civilization,
  CivilizationBuilder,
  CivilizationConfig,
  CivilizationType,
  House,
  PeopleEntity,
  Resource,
  ResourceTypes,
  isExtractionBuilding,
  defaultCivilizationConfig,
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
import { UpdateCivilizationDtoType } from './dto'
import { AnyBulkWriteOperation, Types } from 'mongoose'
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
      MAXIMUM_CHILDREN: c.MAXIMUM_CHILDREN,
      // OPEN_EXCHANGE and AT_WAR_WITH are stored as ObjectId refs
      OPEN_EXCHANGE: (c.OPEN_EXCHANGE ?? []).map(String),
      AT_WAR_WITH: (c.AT_WAR_WITH ?? []).map(String),
      MILITARY_RATIO: c.MILITARY_RATIO ?? 0,
      NEXT_BUILDING_TO_BUILD: c.NEXT_BUILDING_TO_BUILD ?? null,
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
          MAXIMUM_CHILDREN:
            body.maximumChildren ??
            currentConfig.MAXIMUM_CHILDREN ??
            defaultCivilizationConfig.MAXIMUM_CHILDREN,
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
}
