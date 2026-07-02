import { AchievementId, Gender, World, evaluateAchievements } from '@ajustor/simulation'
import type { CombatRecord } from '@ajustor/simulation'
import { Types } from 'mongoose'
import { AchievementModel, CemeteryStatsModel, CivilizationStatsModel, CombatLogModel, GraveModel, TradeOfferModel } from '../../libs/database/models'
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

type GraveDoc = {
  civilizationId: string
  name: string
  cause: string
  month: number
  ageAtDeath?: number
}

// Cumule les décès du mois dans les compteurs persistants (CemeteryStats), qui
// survivent à l'élagage des tombes. Les civilisations d'avant ces compteurs sont
// amorcées depuis leurs stèles encore conservées — AVANT l'insertion des tombes
// du mois, pour ne pas compter deux fois les morts de ce mois-ci.
async function recordDeathCauseCounts(graveDocs: GraveDoc[]) {
  const civilizationIds = [...new Set(graveDocs.map((grave) => grave.civilizationId))]

  const existing = await CemeteryStatsModel.find(
    { civilizationId: { $in: civilizationIds } },
    'civilizationId',
  ).lean()
  const alreadyTracked = new Set(existing.map((doc) => String(doc.civilizationId)))
  const toSeed = civilizationIds.filter((id) => !alreadyTracked.has(String(id)))

  if (toSeed.length) {
    const grouped = await GraveModel.aggregate<{
      _id: { civilizationId: Types.ObjectId; cause: string }
      count: number
    }>([
      { $match: { civilizationId: { $in: toSeed.map((id) => new Types.ObjectId(id)) } } },
      { $group: { _id: { civilizationId: '$civilizationId', cause: '$cause' }, count: { $sum: 1 } } },
    ])

    const seeds = new Map<string, Record<string, number>>()
    for (const id of toSeed) {
      seeds.set(String(id), {})
    }
    for (const { _id, count } of grouped) {
      const causes = seeds.get(String(_id.civilizationId))
      if (causes) {
        causes[_id.cause] = count
      }
    }
    await CemeteryStatsModel.insertMany(
      [...seeds].map(([civilizationId, causes]) => ({ civilizationId, causes })),
      // Un doc peut avoir été créé entre-temps (lecture concurrente) : on ignore
      // le doublon plutôt que de faire échouer tout le mois.
      { ordered: false },
    ).catch(() => {})
  }

  const increments = new Map<string, Record<string, number>>()
  for (const grave of graveDocs) {
    const civIncrements = increments.get(grave.civilizationId) ?? {}
    const key = `causes.${grave.cause}`
    civIncrements[key] = (civIncrements[key] ?? 0) + 1
    increments.set(grave.civilizationId, civIncrements)
  }
  await CemeteryStatsModel.bulkWrite(
    [...increments].map(([civilizationId, inc]) => ({
      updateOne: {
        filter: { civilizationId },
        update: { $inc: inc },
        upsert: true,
      },
    })),
  )
}

// Débloque les succès nouvellement mérités ce mois-ci : les succès « d'état »
// (population, technologies, ressources…) évalués sur chaque civilisation
// vivante, plus le succès événementiel de première victoire tiré des batailles
// du mois. Un succès déjà acquis n'est jamais retiré ni ré-inséré (index unique).
async function grantAchievements(world: World) {
  const aliveCivilizations = world.civilizations.filter(
    (civilization) => civilization.people.length > 0,
  )
  if (!aliveCivilizations.length) {
    return
  }

  const existing = await AchievementModel.find(
    { civilizationId: { $in: aliveCivilizations.map((civilization) => civilization.id) } },
    'civilizationId achievementId',
  ).lean()
  const ownedByCiv = new Map<string, Set<string>>()
  for (const doc of existing) {
    const key = String(doc.civilizationId)
    const owned = ownedByCiv.get(key) ?? new Set<string>()
    owned.add(doc.achievementId)
    ownedByCiv.set(key, owned)
  }

  const winners = new Set(
    world.lastBattles.map((record: CombatRecord) =>
      record.attackerWins ? record.attackerCivId : record.defenderCivId,
    ),
  )

  const month = world.getMonth()
  const unlockedDocs: { civilizationId: string; achievementId: string; month: number }[] = []
  for (const civilization of aliveCivilizations) {
    const owned = ownedByCiv.get(civilization.id) ?? new Set<string>()
    for (const achievement of evaluateAchievements(civilization, owned)) {
      unlockedDocs.push({
        civilizationId: civilization.id,
        achievementId: achievement.id,
        month,
      })
    }
    if (winners.has(civilization.id) && !owned.has(AchievementId.FIRST_VICTORY)) {
      unlockedDocs.push({
        civilizationId: civilization.id,
        achievementId: AchievementId.FIRST_VICTORY,
        month,
      })
    }
  }

  if (unlockedDocs.length) {
    // Un déblocage concurrent (deux mois simulés de front) peut créer un
    // doublon : l'index unique le rejette, on ignore l'erreur sans faire
    // échouer le mois.
    await AchievementModel.insertMany(unlockedDocs, { ordered: false }).catch(() => {})
  }
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
      people: { men, women, pregnantWomen, children: civilization.childrenCount },
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
      ageAtDeath: death.ageAtDeath,
    })),
  )
  if (graveDocs.length) {
    // L'amorçage des compteurs cumulés lit les tombes existantes : il doit
    // précéder l'insertion des tombes du mois.
    await recordDeathCauseCounts(graveDocs)
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

  // Succès : évaluer l'état de chaque civilisation après le mois écoulé.
  await grantAchievements(world)

  await civilizationService.saveAll(worldCivilizations)

  // Une civ qui meurt ce mois-ci (plus aucun habitant) voit ses offres de
  // marché retirées : un doc « zombie » subsiste en base, mais ses offres ne
  // doivent plus apparaître sur le marché.
  const deadCivilizationIds = worldCivilizations
    .filter((civilization) => civilization.people.length === 0)
    .map((civilization) => civilization.id)
  if (deadCivilizationIds.length > 0) {
    await TradeOfferModel.deleteMany({
      fromCivilizationId: { $in: deadCivilizationIds },
    })
  }

  return worldCivilizations
}
