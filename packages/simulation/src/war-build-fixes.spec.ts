/**
 * TDD suite for three logic fixes in civilization.ts:
 *
 * Fix 1 — Soldiers must not be picked as house builders.
 * Fix 2 — Citizens currently building must not be recruited as soldiers.
 * Fix 3 — Released captives must carry their origin civilization id.
 */

import { Civilization } from './civilization'
import { People } from './people/people'
import { Gender } from './people/enum'
import { Resource, ResourceTypes } from './resource'
import { OccupationTypes } from './people/work/enum'
import { House } from './buildings/house'

// ── helpers ────────────────────────────────────────────────────────────────

/** Adult male worker with a given occupation, old enough to work. */
function makeAdult(occupation: OccupationTypes, id: string): People {
  // month = 12*30 → 30 years old
  const p = new People({ month: 12 * 30, gender: Gender.MALE, lifeCounter: 10 })
  p.id = id
  p.setOccupation(occupation)
  return p
}

// ── Fix 1: Soldiers excluded from house builders ───────────────────────────

describe('Fix 1: soldiers are not picked as house builders', () => {
  it('a soldier is NOT set to isBuilding after buildNewHouses()', () => {
    const civ = new Civilization('BuildTest')

    // Add a soldier (should be excluded from building)
    const soldier = makeAdult(OccupationTypes.SOLDIER, 'soldier-1')
    civ.addPeople(soldier)

    // Add a gatherer (should be eligible to build)
    const gatherer = makeAdult(OccupationTypes.GATHERER, 'gatherer-1')
    civ.addPeople(gatherer)

    // Population = 2; no houses → capacity = 0 → workerNeeded >= 1
    // Provide enough wood for at least one house (cost = 15)
    civ.addResource(new Resource(ResourceTypes.WOOD, 100))

    civ['buildNewHouses']()

    expect(soldier.isBuilding).toBe(false)
  })

  it('a gatherer IS set to isBuilding after buildNewHouses() when population exceeds housing', () => {
    const civ = new Civilization('BuildTest2')

    const soldier = makeAdult(OccupationTypes.SOLDIER, 'soldier-2')
    civ.addPeople(soldier)

    const gatherer = makeAdult(OccupationTypes.GATHERER, 'gatherer-2')
    civ.addPeople(gatherer)

    // Population = 2; no houses → capacity = 0 → workerNeeded >= 1
    civ.addResource(new Resource(ResourceTypes.WOOD, 100))

    civ['buildNewHouses']()

    // At least the gatherer (non-soldier) should have been put to work building
    expect(gatherer.isBuilding).toBe(true)
  })
})

// ── Fix 2: Citizens already building are not recruited as soldiers ─────────

describe('Fix 2: citizens already building are not recruited as soldiers', () => {
  it('a citizen with isBuilding=true is NOT recruited as soldier', () => {
    const civ = new Civilization('MilTest')

    // Set a high military ratio so recruitSoldiers() tries to recruit
    civ.config = { ...civ.config, MILITARY_RATIO: 50 }

    // A builder: adult, currently building
    const builder = makeAdult(OccupationTypes.GATHERER, 'builder-1')
    builder.startBuilding(2) // isBuilding = true
    civ.addPeople(builder)

    // A free adult: eligible for recruitment
    const freeAdult = makeAdult(OccupationTypes.GATHERER, 'free-1')
    civ.addPeople(freeAdult)

    civ['recruitSoldiers']()

    // The citizen who was building should NOT have been recruited
    expect(builder.work?.occupationType).not.toBe(OccupationTypes.SOLDIER)
  })

  it('a free adult (not building) CAN be recruited as a soldier', () => {
    const civ = new Civilization('MilTest2')

    civ.config = { ...civ.config, MILITARY_RATIO: 50 }

    const builder = makeAdult(OccupationTypes.GATHERER, 'builder-2')
    builder.startBuilding(2)
    civ.addPeople(builder)

    const freeAdult = makeAdult(OccupationTypes.GATHERER, 'free-2')
    civ.addPeople(freeAdult)

    civ['recruitSoldiers']()

    // The free adult should have been recruited
    expect(freeAdult.work?.occupationType).toBe(OccupationTypes.SOLDIER)
  })
})

// ── Fix 3: Released captives receive their origin civilization id ───────────

describe('Fix 3: releaseCaptives marks origin civilization id', () => {
  it('a captive without an origin gets the defending civilization id', () => {
    const def = new Civilization('Def')

    // A non-soldier citizen with no origin
    const citizen = makeAdult(OccupationTypes.GATHERER, 'captive-1')
    expect(citizen.originCivilizationId).toBeUndefined()
    def.addPeople(citizen)

    const released = def.releaseCaptives(1)

    expect(released).toHaveLength(1)
    expect(released[0].originCivilizationId).toBe(def.id)
  })

  it('a captive that already has an origin keeps its original civilization id', () => {
    const def = new Civilization('Def')

    // A citizen already tagged as coming from another civilization
    const citizen = makeAdult(OccupationTypes.GATHERER, 'captive-2')
    citizen.originCivilizationId = 'autre-civ'
    def.addPeople(citizen)

    const released = def.releaseCaptives(1)

    expect(released).toHaveLength(1)
    // Origin must NOT be overwritten by def.id
    expect(released[0].originCivilizationId).toBe('autre-civ')
  })
})
