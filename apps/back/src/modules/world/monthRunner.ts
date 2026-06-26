import { Gender, World } from '@ajustor/simulation'
import type { CombatRecord } from '@ajustor/simulation'
import { CivilizationStatsModel, CombatLogModel, GraveModel } from '../../libs/database/models'
import type { CivilizationService } from '../civilizations/service'

// Cap on how many graves are kept per civilization so the cemetery doesn't grow
// without bound. Older graves beyond this are pruned after each month.
const GRAVES_PER_CIVILIZATION = 200

// Keep only the most recent graves of a civilization, deleting the oldest excess.
async function pruneGraves(civilizationId: string) {
  const total = await GraveModel.countDocuments({ civilizationId })
  if (total <= GRAVES_PER_CIVILIZATION) {
    return
  }
  const toRemove = total - GRAVES_PER_CIVILIZATION
  const oldest = await GraveModel.find({ civilizationId }, '_id')
    .sort({ createdAt: 1, _id: 1 })
    .limit(toRemove)
    .lean()
  await GraveModel.deleteMany({ _id: { $in: oldest.map((grave) => grave._id) } })
}

/**
 * Loads the alive civilizations of a world (with their people) and attaches
 * them to the world instance so it can simulate a month.
 */
export async function attachAliveCivilizations(
  world: World,
  civilizationService: CivilizationService,
) {
  const civilizations = await civilizationService.getAliveByWorldId(world.id, {
    people: true,
  })

  // Reset first so a reused world instance (e.g. running several months in a
  // row) gets the freshly reloaded civilizations instead of accumulating
  // duplicates of the same civilization.
  world.clearCivilizations()
  world.addCivilization(
    ...civilizations.filter((civilization) => civilization.people.length),
  )

  return civilizations
}

/**
 * Builds the per-civilization monthly stats documents for a world. `event` is
 * the world event applied this month (captured before `passAMonth`).
 */
export function buildCivilizationStats(
  world: World,
  event: World['nextEvent'],
) {
  return world.civilizations.map((civilization) => {
    const { people, livedMonths, resources, id: civilizationId } = civilization

    const { men, women, pregnantWomen } = people.reduce(
      (acc, person) => {
        if (person.gender === Gender.MALE) {
          acc.men++
        }

        if (person.gender === Gender.FEMALE) {
          acc.women++
          if (person.child) {
            acc.pregnantWomen++
          }
        }
        return acc
      },
      { men: 0, women: 0, pregnantWomen: 0 },
    )

    return {
      month: livedMonths,
      event,
      resources: resources.map((resource) => ({
        ...resource.formatToType(),
        resourceType: resource.type,
      })),
      civilizationId,
      people: { men, women, pregnantWomen },
      buildings: civilization.buildings.map((building) => ({
        buildingType: building.getType(),
        count: building.count,
      })),
    }
  })
}

/**
 * Runs a single simulated month for a world: loads its civilizations, applies
 * the month, persists the monthly stats and saves the civilizations.
 */
export async function runMonthForWorld(
  world: World,
  civilizationService: CivilizationService,
  { withStats = true }: { withStats?: boolean } = {},
) {
  const worldCivilizations = await attachAliveCivilizations(
    world,
    civilizationService,
  )

  const event = world.nextEvent
  await world.passAMonth()

  if (world.lastBattles.length > 0) {
    const civNameMap = new Map(worldCivilizations.map((c) => [c.id, c.name]))

    const combatDocs = world.lastBattles.flatMap((record: CombatRecord) => [
      {
        battleId: record.battleId,
        worldId: record.worldId,
        civilizationId: record.attackerCivId,
        role: 'attacker' as const,
        opponentCivId: record.defenderCivId,
        opponentName: civNameMap.get(record.defenderCivId) ?? 'Inconnu',
        month: record.month,
        attackerStrength: record.attackerStrength,
        defenderStrength: record.defenderStrength,
        attackerWins: record.attackerWins,
        myLossRatio: record.attackerLossRatio,
        opponentLossRatio: record.defenderLossRatio,
        plunderedResources: record.plunderedResources,
        captivesTaken: record.captivesTaken,
      },
      {
        battleId: record.battleId,
        worldId: record.worldId,
        civilizationId: record.defenderCivId,
        role: 'defender' as const,
        opponentCivId: record.attackerCivId,
        opponentName: civNameMap.get(record.attackerCivId) ?? 'Inconnu',
        month: record.month,
        attackerStrength: record.attackerStrength,
        defenderStrength: record.defenderStrength,
        attackerWins: record.attackerWins,
        myLossRatio: record.defenderLossRatio,
        opponentLossRatio: record.attackerLossRatio,
        plunderedResources: record.attackerWins ? record.plunderedResources : [],
        captivesTaken: record.attackerWins ? record.captivesTaken : 0,
      },
    ])

    await CombatLogModel.insertMany(combatDocs)
  }

  if (withStats) {
    const stats = buildCivilizationStats(world, event)
    if (stats.length) {
      await CivilizationStatsModel.insertMany(stats)
    }
  }

  // Record this month's deaths in each civilization's cemetery, then prune.
  const deathMonth = world.getMonth()
  const graveDocs = world.civilizations.flatMap((civilization) =>
    civilization.deaths.map((death) => ({
      civilizationId: civilization.id,
      name: death.name,
      cause: death.cause,
      month: deathMonth,
    })),
  )
  if (graveDocs.length) {
    await GraveModel.insertMany(graveDocs)
    const civilizationIdsWithDeaths = [
      ...new Set(
        world.civilizations
          .filter((civilization) => civilization.deaths.length)
          .map((civilization) => civilization.id),
      ),
    ]
    await Promise.all(civilizationIdsWithDeaths.map(pruneGraves))
  }

  await civilizationService.saveAll(worldCivilizations)

  return worldCivilizations
}
