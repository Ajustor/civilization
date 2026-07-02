import {
  CivilizationBuilder,
  Gender,
  MINIMAL_AGE_TO_BECOME,
  OccupationTypes,
  People,
  Resource,
  ResourceTypes,
  Tent,
  formatCivilizations,
} from '@ajustor/simulation'
import Elysia, { NotFoundError, t } from 'elysia'

import { CivilizationService } from './service'
import { PeopleService } from '../people/service'
import { authorization } from '../../libs/handlers/authorization'
import { jwtMiddleware } from '../../libs/jwt'
import { logger } from '@bogeychan/elysia-logger'
import { UpdateCivilizationDto } from './dto'
import { ColonizeDto } from './colonize.dto'
import { ReclaimDto } from './reclaim.dto'

const INITIAL_CITIZEN_NUMBER = 50
const INITIAL_CITIZEN_LIFE = 3
const INITIAL_OCCUPATION_CHOICE = [
  OccupationTypes.WOODCUTTER,
  OccupationTypes.GATHERER,
]

// Pyramide des âges des fondateurs : la population de départ mêle enfants,
// jeunes actifs, adultes et quelques anciens au lieu de 50 jumeaux de 16 ans.
const INITIAL_AGE_PYRAMID: { weight: number; minYears: number; maxYears: number }[] = [
  { weight: 15, minYears: 2, maxYears: 11 }, // enfants
  { weight: 30, minYears: 12, maxYears: 20 }, // jeunes actifs
  { weight: 30, minYears: 21, maxYears: 32 }, // adultes
  { weight: 17, minYears: 33, maxYears: 44 }, // âge mûr
  { weight: 8, minYears: 45, maxYears: 55 }, // anciens
]

const drawInitialAgeInMonths = (): number => {
  const totalWeight = INITIAL_AGE_PYRAMID.reduce(
    (sum, bucket) => sum + bucket.weight,
    0,
  )
  let roll = Math.random() * totalWeight
  const bucket =
    INITIAL_AGE_PYRAMID.find((candidate) => (roll -= candidate.weight) < 0) ??
    INITIAL_AGE_PYRAMID[INITIAL_AGE_PYRAMID.length - 1]
  const years =
    bucket.minYears +
    Math.floor(Math.random() * (bucket.maxYears - bucket.minYears + 1))
  return years * 12 + Math.floor(Math.random() * 12)
}
const INITIAL_CIVILIZATION_RESOURCES = {
  RAW_FOOD: 1000,
  WOOD: 100,
  STONE: 0,
}

// Pas d'entrepôt offert à la fondation : le bâtir (30 bois + 20 planches,
// 4 récolteurs) est un des premiers objectifs de la civilisation — sans lui,
// aucune ressource n'est protégée des incendies et invasions de rats.
// Les fondateurs démarrent sous des tentes : la Maison (capacité double) doit
// être débloquée par la recherche « Construction » puis bâtie en consommant
// une tente par maison.
const INITIAL_CIVILIZATION_BUILDING = [
  new Tent(Math.ceil(INITIAL_CITIZEN_NUMBER / Tent.capacity)),
]

const civilizationServiceInstance = new CivilizationService(new PeopleService())

export const civilizationModule = new Elysia({ prefix: '/civilizations' })
  .use(logger())
  .use(jwtMiddleware)
  .decorate({ civilizationService: civilizationServiceInstance })
  .get('', async ({ civilizationService }) => {
    const civilizations = await civilizationService.getAll({ people: true })
    return {
      count: civilizations.length,
      civilizations: formatCivilizations(civilizations),
    }
  })
  // Tableau des scores public : civilisations classées par points de succès.
  .get('/leaderboard', async ({ civilizationService }) =>
    civilizationService.getLeaderboard(),
  )
  .use(authorization('Actions on civilization require auth'))
  .get('/mine', async ({ user, civilizationService }) => {
    const civilizations = await civilizationService.getByUserId(user.id, {
      people: false,
    })
    const formatted = formatCivilizations(civilizations)
    const counts = await Promise.all(
      civilizations.map((civ) => civilizationService.getRecentAttacksCount(civ.id)),
    )
    const worldRefs = await civilizationService.getWorldRefs(
      civilizations.map((civ) => civ.id),
    )
    return {
      count: civilizations.length,
      civilizations: formatted.map((civ, i) => ({
        ...civ,
        recentAttacksCount: counts[i],
        worldId: worldRefs[civ.id]?.worldId ?? null,
        worldName: worldRefs[civ.id]?.worldName ?? null,
      })),
    }
  })
  .get(
    '/:civilizationId',
    async ({ user, civilizationService, params: { civilizationId } }) => {
      const civilization = await civilizationService.getByUserAndCivilizationId(
        user.id,
        civilizationId,
      )
      if (!civilization) {
        return { civilization: undefined }
      }
      const [formatted] = formatCivilizations([civilization])
      const worldRefs = await civilizationService.getWorldRefs([civilization.id])
      return {
        civilization: {
          ...formatted,
          worldId: worldRefs[civilization.id]?.worldId ?? null,
          worldName: worldRefs[civilization.id]?.worldName ?? null,
        },
      }
    },
  )
  .get(
    '/:civilizationId/recap',
    async ({ user, civilizationService, params: { civilizationId } }) =>
      civilizationService.getRecap(user.id as string, civilizationId),
  )
  .get(
    '/:civilizationId/achievements',
    async ({ user, civilizationService, params: { civilizationId }, set }) => {
      try {
        return await civilizationService.getAchievements(user.id as string, civilizationId)
      } catch (error) {
        set.status = 404
        return { error: error instanceof Error ? error.message : 'Civilization not found' }
      }
    },
  )
  .post(
    '/:civilizationId/technologies/:techId',
    async ({ user, civilizationService, params: { civilizationId, techId }, set }) => {
      try {
        return await civilizationService.unlockTech(user.id as string, civilizationId, techId)
      } catch (error) {
        set.status = 400
        return { error: error instanceof Error ? error.message : 'Unable to unlock technology' }
      }
    },
  )
  .post(
    '/:civilizationId/colonize',
    async ({ user, civilizationService, params: { civilizationId }, body, set }) => {
      try {
        return await civilizationService.colonize(user.id as string, civilizationId, body)
      } catch (error) {
        set.status = 400
        return { error: error instanceof Error ? error.message : 'Unable to colonize' }
      }
    },
    { body: ColonizeDto },
  )
  .post(
    '/:civilizationId/reclaim',
    async ({ user, civilizationService, params: { civilizationId }, body, set }) => {
      try {
        return await civilizationService.reclaimResources(
          user.id as string,
          civilizationId,
          body.targetCivilizationId,
        )
      } catch (error) {
        set.status = 400
        return { error: error instanceof Error ? error.message : 'Unable to reclaim resources' }
      }
    },
    { body: ReclaimDto },
  )
  .post(
    '',
    async ({ civilizationService, body, log, user, set }) => {
      const civilizationWithThatNameExist = await civilizationService.exist(
        body.name,
      )
      if (civilizationWithThatNameExist) {
        log.error('Conflict a civilization with that name already exist')
        set.status = 409
        return 'A civilization with that name already exist'
      }

      const civilizationBuilder = new CivilizationBuilder()

      const people = Array.from(Array(INITIAL_CITIZEN_NUMBER)).map((_, idx) => {
        const person = new People({
          month: drawInitialAgeInMonths(),
          gender: idx % 2 === 0 ? Gender.FEMALE : Gender.MALE,
          lifeCounter: INITIAL_CITIZEN_LIFE,
        })

        // Les fondateurs trop jeunes pour les métiers de départ commencent
        // enfants et évolueront d'eux-mêmes à l'âge requis.
        const startingOccupations = INITIAL_OCCUPATION_CHOICE.filter(
          (occupation) => person.years >= MINIMAL_AGE_TO_BECOME[occupation],
        )
        person.setOccupation(
          startingOccupations.length
            ? startingOccupations[
            Math.floor(Math.random() * startingOccupations.length)
            ]
            : OccupationTypes.CHILD,
        )

        return person
      })

      civilizationBuilder
        .withName(body.name)
        .addResource(
          new Resource(
            ResourceTypes.RAW_FOOD,
            INITIAL_CIVILIZATION_RESOURCES.RAW_FOOD,
          ),
          new Resource(ResourceTypes.WOOD, INITIAL_CIVILIZATION_RESOURCES.WOOD),
          new Resource(
            ResourceTypes.STONE,
            INITIAL_CIVILIZATION_RESOURCES.STONE,
          ),
        )
        .addBuilding(...INITIAL_CIVILIZATION_BUILDING)
        .addCitizen(...people)

      await civilizationService.create(
        user.id as string,
        civilizationBuilder.build(),
        body.worldId,
      )
    },
    {
      body: t.Object({
        name: t.String({ minLength: 3 }),
        worldId: t.Optional(t.String()),
      }),
    },
  )
  .delete(
    '/:civilizationId',
    async ({ civilizationService, params: { civilizationId }, user }) => {
      await civilizationService.delete(user.id as string, civilizationId)
    },
  )
  .patch(
    '/:civilizationId',
    async ({ civilizationService, params: { civilizationId }, user, body, set }) => {
      try {
        await civilizationService.update(user.id as string, civilizationId, body)
      } catch (error) {
        set.status = 400
        return { error: error instanceof Error ? error.message : 'Unable to update civilization' }
      }
    },
    {
      body: UpdateCivilizationDto
    }
  )
  .get(
    '/:civilizationId/stats',
    ({
      params: { civilizationId },
      civilizationService,
      query: { limit = 100 },
    }) => civilizationService.getCivilizationStats(civilizationId, limit),
    {
      query: t.Object({
        limit: t.Optional(t.Number()),
      }),
    },
  )
  .get(
    '/:civilizationId/world',
    async ({ civilizationService, params: { civilizationId } }) => {
      const worldId = await civilizationService.getWorldId(civilizationId)
      if (!worldId) {
        throw new NotFoundError('Civilization not found in any world')
      }
      return { worldId }
    },
  )
  .get(
    '/:civilizationId/attackers',
    async ({ civilizationService, params: { civilizationId } }) => {
      const attackers = await civilizationService.getAttackers(civilizationId)
      return { attackers }
    },
  )
  .get(
    '/:civilizationId/combat-logs',
    async ({
      civilizationService,
      params: { civilizationId },
      query: { limit = 20, offset = 0 },
    }) => {
      await civilizationService.markCombatLogsViewed(civilizationId)
      const logs = await civilizationService.getCombatLogs(civilizationId, limit, offset)
      return { logs }
    },
    {
      query: t.Object({
        limit: t.Optional(t.Number()),
        offset: t.Optional(t.Number()),
      }),
    },
  )
  .get(
    '/:civilizationId/cemetery',
    async ({
      civilizationService,
      params: { civilizationId },
      query: { limit = 20, offset = 0 },
    }) => {
      const [graves, causes] = await Promise.all([
        civilizationService.getGraves(civilizationId, limit, offset),
        civilizationService.getDeathCauseCounts(civilizationId),
      ])
      return { graves, causes }
    },
    {
      query: t.Object({
        limit: t.Optional(t.Number()),
        offset: t.Optional(t.Number()),
      }),
    },
  )
