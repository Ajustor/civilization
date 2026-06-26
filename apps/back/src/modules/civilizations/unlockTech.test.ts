import { test, expect, mock, beforeEach } from 'bun:test'
import { TechId, getTechNode } from '@ajustor/simulation'

// `unlockTech` ne touche que deux choses côté persistance : la lecture du user
// (avec ses civilisations peuplées) et l'écriture `CivilizationModel.updateOne`.
// On stub donc uniquement ces deux modèles Mongoose via `mock.module`, sans base
// de données réelle. `getTechNode`/`TECH_TREE` restent les vrais (la logique de
// prérequis est ainsi exercée contre l'arbre technologique réel).

const USER_ID = 'user-1'
const CIV_ID = 'civ-1'

// File d'attente des civilisations renvoyées par la prochaine lecture user.
let nextCivilizations: any[] = []
const updateOne = mock(async () => ({ acknowledged: true }))

// `service.ts` importe plusieurs modèles depuis ce module ; `mock.module` remplace
// l'export entier, donc on fournit tous les noms importés (les autres modèles ne
// sont pas utilisés par `unlockTech` et restent des objets vides).
mock.module('../../libs/database/models', () => ({
  UserModel: {
    findOne: () => ({
      // `unlockTech` fait `await UserModel.findOne(...).populate(...)`.
      populate: async () => ({ id: USER_ID, civilizations: nextCivilizations }),
    }),
  },
  CivilizationModel: {
    updateOne,
  },
  CivilizationStatsModel: {},
  CombatLogModel: {},
  GraveModel: {},
  PersonModel: {},
  WorldModel: {},
}))

// Import dynamique APRÈS le mock.module pour que le service capte les modèles stubés.
const { CivilizationService } = await import('./service')
// `unlockTech` n'utilise jamais le PeopleService : un stub vide suffit.
const service = new CivilizationService({} as any)

const makeCiv = (overrides: Partial<{ researchPoints: number; researchedTechs: string[] }> = {}) => ({
  id: CIV_ID,
  researchPoints: overrides.researchPoints ?? 100,
  researchedTechs: overrides.researchedTechs ?? [],
})

beforeEach(() => {
  updateOne.mockClear()
  nextCivilizations = [makeCiv()]
})

test('succès : déduit le coût et ajoute la techno, et persiste', async () => {
  const node = getTechNode(TechId.CRAFTSMANSHIP)! // cost 5, aucun prérequis
  nextCivilizations = [makeCiv({ researchPoints: 7, researchedTechs: [] })]

  const result = await service.unlockTech(USER_ID, CIV_ID, TechId.CRAFTSMANSHIP)

  expect(result.researchPoints).toBe(7 - node.cost)
  expect(result.researchedTechs).toEqual([TechId.CRAFTSMANSHIP])

  // Persistance appelée avec le nouvel état.
  expect(updateOne).toHaveBeenCalledTimes(1)
  const [filter, payload] = updateOne.mock.calls[0] as [any, any]
  expect(filter).toEqual({ _id: CIV_ID })
  expect(payload.researchPoints).toBe(7 - node.cost)
  expect(payload.researchedTechs).toEqual([TechId.CRAFTSMANSHIP])
})

test('refus : pas assez de points de recherche', async () => {
  nextCivilizations = [makeCiv({ researchPoints: 4, researchedTechs: [] })] // < cost 5

  await expect(service.unlockTech(USER_ID, CIV_ID, TechId.CRAFTSMANSHIP)).rejects.toThrow(
    'Not enough research points',
  )
  expect(updateOne).not.toHaveBeenCalled()
})

test('refus : prérequis manquant', async () => {
  // MASONRY exige CRAFTSMANSHIP, qui n'est pas acquis.
  nextCivilizations = [makeCiv({ researchPoints: 100, researchedTechs: [] })]

  await expect(service.unlockTech(USER_ID, CIV_ID, TechId.MASONRY)).rejects.toThrow(
    'Prerequisites not met',
  )
  expect(updateOne).not.toHaveBeenCalled()
})

test('refus : techno déjà acquise', async () => {
  nextCivilizations = [makeCiv({ researchPoints: 100, researchedTechs: [TechId.CRAFTSMANSHIP] })]

  await expect(service.unlockTech(USER_ID, CIV_ID, TechId.CRAFTSMANSHIP)).rejects.toThrow(
    'Technology already researched',
  )
  expect(updateOne).not.toHaveBeenCalled()
})

test('refus : identifiant de techno inconnu', async () => {
  nextCivilizations = [makeCiv({ researchPoints: 100, researchedTechs: [] })]

  await expect(service.unlockTech(USER_ID, CIV_ID, 'unknown-tech')).rejects.toThrow(
    'Unknown technology',
  )
  expect(updateOne).not.toHaveBeenCalled()
})
