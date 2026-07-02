/**
 * Système générique d'évolution de bâtiments (BUILDING_UPGRADES) :
 *  - Tente → Maison (1 tente consommée, débloquée par la recherche Construction),
 *  - Cache → Entrepôt (2 caches consommées, débloqué par Entreposage, stockage ×3).
 * Le bâtiment de base est consommé au lancement du chantier, comme les ressources.
 */

import { Civilization } from '../civilization'
import { BuildingTypes } from './enum'
import { Tent } from './tent'
import { House } from './house'
import { Cache } from './cache'
import { Warehouse } from './warehouse'
import { getUpgradeRequirement, getUpgradeTarget } from './upgrades'
import { TechId } from '../technology/techTree'
import { People } from '../people/people'
import { Gender } from '../people/enum'
import { OccupationTypes } from '../people/work/enum'
import { Resource, ResourceTypes } from '../resource'

const makeWorker = (id: string, occupation = OccupationTypes.GATHERER) => {
  const person = new People({ month: 12 * 30, gender: Gender.MALE, lifeCounter: 10 })
  person.id = id
  person.setOccupation(occupation)
  return person
}

describe('Registre générique BUILDING_UPGRADES', () => {
  it('la Maison évolue depuis 1 Tente, l’Entrepôt depuis 2 Caches', () => {
    expect(getUpgradeRequirement(BuildingTypes.HOUSE)).toEqual({
      from: BuildingTypes.TENT,
      amount: 1,
    })
    expect(getUpgradeRequirement(BuildingTypes.WAREHOUSE)).toEqual({
      from: BuildingTypes.CACHE,
      amount: 2,
    })
    expect(getUpgradeTarget(BuildingTypes.TENT)).toBe(BuildingTypes.HOUSE)
    expect(getUpgradeTarget(BuildingTypes.CACHE)).toBe(BuildingTypes.WAREHOUSE)
    expect(getUpgradeRequirement(BuildingTypes.FARM)).toBeUndefined()
  })

  it('Tente : la moitié des apports de la Maison', () => {
    expect(Tent.capacity).toBe(House.capacity / 2)
  })

  it('Entrepôt : stocke 3× plus que la Cache, ressource par ressource', () => {
    const cache = new Cache()
    const warehouse = new Warehouse()
    expect(warehouse.storedResources).toHaveLength(cache.storedResources.length)
    for (const stored of cache.storedResources) {
      const upgraded = warehouse.storedResources.find(
        (s) => s.resource === stored.resource,
      )
      expect(upgraded?.maxQuantity).toBe(
        stored.maxQuantity * Warehouse.STORAGE_MULTIPLIER,
      )
    }
  })

  it('Cache : le count passé au constructeur est conservé (round-trip DB)', () => {
    expect(new Cache(3).count).toBe(3)
    expect(new Warehouse(2).count).toBe(2)
  })
})

describe('Logement : tentes d’abord, maisons après la recherche Construction', () => {
  // Seuls les constructeurs bâtissent : la population de test est faite de
  // constructeurs pour que les chantiers de logement puissent démarrer.
  const makeCiv = (peopleCount: number) => {
    const civ = new Civilization('Housing')
    civ.addResource(new Resource(ResourceTypes.WOOD, 1000))
    for (let i = 0; i < peopleCount; i++) {
      civ.addPeople(makeWorker(`w-${i}`, OccupationTypes.BUILDER))
    }
    return civ
  }

  it('sans la recherche, la civilisation monte des tentes (jamais de maisons)', () => {
    const civ = makeCiv(4)

    civ['buildNewHousing']()

    expect(civ.pendingConstructions.length).toBeGreaterThan(0)
    expect(
      civ.pendingConstructions.every(
        (pending) => pending.buildingType === BuildingTypes.TENT,
      ),
    ).toBe(true)
  })

  it('avec la recherche et une tente debout, la maison consomme la tente au lancement', () => {
    const civ = makeCiv(4)
    civ.researchedTechs = [TechId.CONSTRUCTION]
    civ.addBuilding(new Tent(1)) // capacité 2 < 4 habitants → déficit

    civ['buildNewHousing']()

    expect(
      civ.pendingConstructions.some(
        (pending) => pending.buildingType === BuildingTypes.HOUSE,
      ),
    ).toBe(true)
    // La tente a été consommée par le chantier de la maison.
    expect(civ.tents).toBeUndefined()
  })

  it('avec la recherche mais sans tente, on retombe sur des tentes', () => {
    const civ = makeCiv(4)
    civ.researchedTechs = [TechId.CONSTRUCTION]

    civ['buildNewHousing']()

    expect(
      civ.pendingConstructions.some(
        (pending) => pending.buildingType === BuildingTypes.TENT,
      ),
    ).toBe(true)
    expect(
      civ.pendingConstructions.some(
        (pending) => pending.buildingType === BuildingTypes.HOUSE,
      ),
    ).toBe(false)
  })

  it('la capacité de logement additionne tentes et maisons (checkHousing)', () => {
    const civ = makeCiv(0)
    civ.addBuilding(new Tent(2), new House(1))
    expect(civ.housingCapacity).toBe(Tent.capacity * 2 + House.capacity)
  })
})

describe('Entrepôt via le chemin générique buildNew', () => {
  const setup = (cacheCount: number, techs: TechId[] = [TechId.WAREHOUSING]) => {
    const civ = new Civilization('Warehouse')
    civ.researchedTechs = techs
    civ.addResource(
      new Resource(ResourceTypes.WOOD, 1000),
      new Resource(ResourceTypes.PLANK, 1000),
    )
    if (cacheCount) {
      civ.addBuilding(new Cache(cacheCount))
    }
    for (let i = 0; i < 8; i++) {
      civ.addPeople(makeWorker(`g-${i}`, OccupationTypes.BUILDER))
    }
    return civ
  }

  const tryBuildWarehouse = (civ: Civilization) =>
    civ['buildNew'](
      BuildingTypes.WAREHOUSE,
      Warehouse.constructionCosts,
      Warehouse.workerRequiredToBuild,
      Warehouse.timeToBuild,
    )

  it('consomme 2 caches au lancement du chantier', () => {
    const civ = setup(2)

    tryBuildWarehouse(civ)

    expect(
      civ.pendingConstructions.some(
        (pending) => pending.buildingType === BuildingTypes.WAREHOUSE,
      ),
    ).toBe(true)
    expect(civ.cache).toBeUndefined()
  })

  it('laisse les caches excédentaires debout', () => {
    const civ = setup(3)

    tryBuildWarehouse(civ)

    expect(civ.cache?.count).toBe(1)
  })

  it('refuse le chantier avec une seule cache', () => {
    const civ = setup(1)

    tryBuildWarehouse(civ)

    expect(civ.pendingConstructions).toHaveLength(0)
    expect(civ.cache?.count).toBe(1)
  })

  it('refuse le chantier sans la recherche Entreposage', () => {
    const civ = setup(2, [])

    tryBuildWarehouse(civ)

    expect(civ.pendingConstructions).toHaveLength(0)
    expect(civ.cache?.count).toBe(2)
  })

  it('une fois debout, l’entrepôt fournit sa capacité de stockage', () => {
    const civ = setup(2, [])
    civ.constructBuilding(BuildingTypes.WAREHOUSE)

    const cacheWood = new Cache().storedResources.find(
      (s) => s.resource === ResourceTypes.WOOD,
    )!
    // 2 caches + 1 entrepôt (3× cache), sans multiplicateur de recherche.
    expect(civ.getStorageCapacity(ResourceTypes.WOOD)).toBe(
      cacheWood.maxQuantity * 2 +
        cacheWood.maxQuantity * Warehouse.STORAGE_MULTIPLIER,
    )
  })
})

describe('Chantier sans ouvriers déclarés : au moins un constructeur mobilisé', () => {
  it('mobilise un constructeur pour bâtir une tente', () => {
    const civ = new Civilization('Solo')
    civ.addResource(new Resource(ResourceTypes.WOOD, 100))
    const worker = makeWorker('g-0', OccupationTypes.BUILDER)
    civ.addPeople(worker)

    civ['buildNew'](
      BuildingTypes.TENT,
      Tent.constructionCosts,
      Tent.workerRequiredToBuild,
      Tent.timeToBuild,
    )

    expect(
      civ.pendingConstructions.some(
        (pending) => pending.buildingType === BuildingTypes.TENT,
      ),
    ).toBe(true)
    expect(worker.isBuilding).toBe(true)
  })

  it('sans constructeur disponible, aucun chantier ne démarre (un récolteur ne suffit pas)', () => {
    const civ = new Civilization('Empty')
    civ.addResource(new Resource(ResourceTypes.WOOD, 100))
    civ.addPeople(makeWorker('g-1', OccupationTypes.GATHERER))

    civ['buildNew'](
      BuildingTypes.TENT,
      Tent.constructionCosts,
      Tent.workerRequiredToBuild,
      Tent.timeToBuild,
    )

    expect(civ.pendingConstructions).toHaveLength(0)
  })
})
