import { Gender, World } from '@ajustor/simulation'
import { CivilizationStatsModel } from '../../libs/database/models'
import type { CivilizationService } from '../civilizations/service'

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

  if (withStats) {
    const stats = buildCivilizationStats(world, event)
    if (stats.length) {
      await CivilizationStatsModel.insertMany(stats)
    }
  }

  await civilizationService.saveAll(worldCivilizations)

  return worldCivilizations
}
