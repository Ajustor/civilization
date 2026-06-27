import { splitCivilization } from './colonize'
import { People } from './people/people'
import { Resource, ResourceTypes } from './resource'
import { Gender } from './people/enum'

const makePeople = (count: number): People[] =>
  Array.from({ length: count }, (_, i) => {
    const p = new People({ month: 12 * 20, gender: i % 2 === 0 ? Gender.MALE : Gender.FEMALE, lifeCounter: 5 })
    p.id = `p-${i}`
    return p
  })

const makeResources = (entries: { type: ResourceTypes; qty: number }[]): Resource[] =>
  entries.map(({ type, qty }) => new Resource(type, qty))

describe('splitCivilization', () => {
  it('transfers the correct number of people (floors the percentage)', () => {
    const result = splitCivilization(makePeople(10), [], {
      populationPercent: 30,
      resourceTransfers: [],
      techsToTransmit: [],
    })
    expect(result.colonyPeople).toHaveLength(3)
    expect(result.motherPeople).toHaveLength(7)
  })

  it('conserves total headcount', () => {
    const result = splitCivilization(makePeople(47), [], {
      populationPercent: 20,
      resourceTransfers: [],
      techsToTransmit: [],
    })
    expect(result.colonyPeople.length + result.motherPeople.length).toBe(47)
  })

  it('no person appears in both groups', () => {
    const result = splitCivilization(makePeople(20), [], {
      populationPercent: 50,
      resourceTransfers: [],
      techsToTransmit: [],
    })
    const colonyIds = new Set(result.colonyPeople.map((p) => p.id))
    expect(result.motherPeople.filter((p) => colonyIds.has(p.id))).toHaveLength(0)
  })

  it('transfers requested resources and reduces mother stock', () => {
    const resources = makeResources([
      { type: ResourceTypes.WOOD, qty: 1000 },
      { type: ResourceTypes.STONE, qty: 500 },
    ])
    const result = splitCivilization(makePeople(20), resources, {
      populationPercent: 10,
      resourceTransfers: [{ type: ResourceTypes.WOOD, amount: 300 }],
      techsToTransmit: [],
    })
    expect(result.colonyResources.find((r) => r.type === ResourceTypes.WOOD)?.quantity).toBe(300)
    expect(result.motherResources.find((r) => r.type === ResourceTypes.WOOD)?.quantity).toBe(700)
  })

  it('untransferred resources stay with mother intact', () => {
    const resources = makeResources([{ type: ResourceTypes.STONE, qty: 500 }])
    const result = splitCivilization(makePeople(20), resources, {
      populationPercent: 10,
      resourceTransfers: [],
      techsToTransmit: [],
    })
    expect(result.motherResources.find((r) => r.type === ResourceTypes.STONE)?.quantity).toBe(500)
    expect(result.colonyResources).toHaveLength(0)
  })

  it('does not mutate the original resources array', () => {
    const resources = makeResources([{ type: ResourceTypes.WOOD, qty: 1000 }])
    splitCivilization(makePeople(20), resources, {
      populationPercent: 10,
      resourceTransfers: [{ type: ResourceTypes.WOOD, amount: 300 }],
      techsToTransmit: [],
    })
    expect(resources[0].quantity).toBe(1000)
  })
})
