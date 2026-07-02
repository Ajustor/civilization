import { test, expect, mock, beforeEach } from 'bun:test'

// `reclaimResources` ne touche, côté persistance, que les modèles Mongoose
// suivants : lecture du user (pour vérifier la propriété), lecture des deux
// civilisations via `findById`, écriture des ressources de la réceptrice
// (`updateOne`), suppression de la civilisation abandonnée (`deleteOne` +
// nettoyage des stats/cimetière), et nettoyage des références (`updateMany`).
// On stub donc uniquement ces modèles, sans base de données réelle.

const USER_ID = 'user-1'
const RECEIVER_ID = 'civ-receiver'
const TARGET_ID = 'civ-target'

let userCivilizations: string[] = []
let civsById: Record<string, any> = {}

const updateOne = mock(async () => ({ acknowledged: true }))
const deleteOne = mock(async () => ({ acknowledged: true, deletedCount: 1 }))
const statsDeleteMany = mock(async () => ({ acknowledged: true }))
const gravesDeleteMany = mock(async () => ({ acknowledged: true }))
const cemeteryStatsDeleteMany = mock(async () => ({ acknowledged: true }))
const updateMany = mock(async () => ({ acknowledged: true }))

mock.module('../../libs/database/models', () => ({
  UserModel: {
    findOne: async () => ({ id: USER_ID, civilizations: userCivilizations }),
  },
  CivilizationModel: {
    findById: (id: string) => civsById[id] ?? null,
    updateOne,
    deleteOne,
    updateMany,
  },
  CivilizationStatsModel: { deleteMany: statsDeleteMany },
  GraveModel: { deleteMany: gravesDeleteMany },
  CemeteryStatsModel: { deleteMany: cemeteryStatsDeleteMany },
  CombatLogModel: {},
  PersonModel: {},
  WorldModel: {},
}))

const { CivilizationService } = await import('./service')
// `reclaimResources` n'utilise jamais le PeopleService : un stub vide suffit.
const service = new CivilizationService({} as any)

const makeCiv = (
  id: string,
  overrides: Partial<{
    people: string[]
    resources: { resourceType: string; quantity: number }[]
  }> = {},
) => ({
  id,
  name: id,
  people: overrides.people ?? [],
  resources: overrides.resources ?? [],
})

beforeEach(() => {
  updateOne.mockClear()
  deleteOne.mockClear()
  statsDeleteMany.mockClear()
  gravesDeleteMany.mockClear()
  cemeteryStatsDeleteMany.mockClear()
  updateMany.mockClear()
  userCivilizations = [RECEIVER_ID, TARGET_ID]
  civsById = {
    [RECEIVER_ID]: makeCiv(RECEIVER_ID, {
      resources: [
        { resourceType: 'wood', quantity: 100 },
        { resourceType: 'stone', quantity: 50 },
      ],
    }),
    [TARGET_ID]: makeCiv(TARGET_ID, {
      people: [],
      resources: [
        { resourceType: 'wood', quantity: 30 },
        { resourceType: 'raw_food', quantity: 200 },
      ],
    }),
  }
})

test('succès : fusionne les ressources et dissout la civilisation abandonnée', async () => {
  const result = await service.reclaimResources(USER_ID, RECEIVER_ID, TARGET_ID)

  // La réceptrice est mise à jour avec les ressources fusionnées.
  expect(updateOne).toHaveBeenCalledTimes(1)
  const [filter, payload] = updateOne.mock.calls[0] as [any, any]
  expect(filter).toEqual({ _id: RECEIVER_ID })
  const byType = Object.fromEntries(
    payload.resources.map((r: any) => [r.resourceType, r.quantity]),
  )
  expect(byType).toEqual({ wood: 130, stone: 50, raw_food: 200 })

  // La civilisation abandonnée est supprimée et nettoyée.
  expect(deleteOne).toHaveBeenCalledWith({ _id: TARGET_ID })
  expect(statsDeleteMany).toHaveBeenCalledWith({ civilizationId: TARGET_ID })
  expect(gravesDeleteMany).toHaveBeenCalledWith({ civilizationId: TARGET_ID })
  expect(updateMany).toHaveBeenCalledTimes(1)

  // Le résumé retourné liste les ressources récupérées.
  const reclaimed = Object.fromEntries(
    result.reclaimedResources.map((r) => [r.type, r.amount]),
  )
  expect(reclaimed).toEqual({ wood: 30, raw_food: 200 })
})

test('refus : la civilisation cible a encore des habitants', async () => {
  civsById[TARGET_ID].people = ['person-1']

  await expect(
    service.reclaimResources(USER_ID, RECEIVER_ID, TARGET_ID),
  ).rejects.toThrow('The target civilization still has inhabitants')
  expect(updateOne).not.toHaveBeenCalled()
  expect(deleteOne).not.toHaveBeenCalled()
})

test("refus : la civilisation cible n'appartient pas au joueur", async () => {
  userCivilizations = [RECEIVER_ID]

  await expect(
    service.reclaimResources(USER_ID, RECEIVER_ID, TARGET_ID),
  ).rejects.toThrow('Target civilization not found')
  expect(updateOne).not.toHaveBeenCalled()
  expect(deleteOne).not.toHaveBeenCalled()
})

test("refus : la civilisation réceptrice n'appartient pas au joueur", async () => {
  userCivilizations = [TARGET_ID]

  await expect(
    service.reclaimResources(USER_ID, RECEIVER_ID, TARGET_ID),
  ).rejects.toThrow('Civilization not found')
  expect(updateOne).not.toHaveBeenCalled()
})

test('refus : on ne peut pas récupérer ses propres ressources', async () => {
  await expect(
    service.reclaimResources(USER_ID, RECEIVER_ID, RECEIVER_ID),
  ).rejects.toThrow('A civilization cannot reclaim its own resources')
  expect(updateOne).not.toHaveBeenCalled()
  expect(deleteOne).not.toHaveBeenCalled()
})
