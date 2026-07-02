import { OccupationTypes } from './enum'
import {
  DEFAULT_OCCUPATION_DISTRIBUTION,
  DISTRIBUTABLE_OCCUPATIONS,
  OCCUPATION_BUILDING,
  resolveTargetHeadcounts,
  sanitizeOccupationDistribution,
} from './distribution'

describe('DEFAULT_OCCUPATION_DISTRIBUTION', () => {
  it('sums to 100 across exactly the distributable occupations (builder inclus)', () => {
    const keys = Object.keys(DEFAULT_OCCUPATION_DISTRIBUTION) as OccupationTypes[]
    expect(new Set(keys)).toEqual(new Set(DISTRIBUTABLE_OCCUPATIONS))
    const sum = keys.reduce((s, k) => s + (DEFAULT_OCCUPATION_DISTRIBUTION[k] ?? 0), 0)
    expect(sum).toBe(100)
  })

  it('maps every building-bound occupation to a building', () => {
    expect(OCCUPATION_BUILDING[OccupationTypes.FARMER]).toBeDefined()
    expect(OCCUPATION_BUILDING[OccupationTypes.MINER]).toBeDefined()
    expect(OCCUPATION_BUILDING[OccupationTypes.ERUDIT]).toBeDefined()
    // Base jobs have no building.
    expect(OCCUPATION_BUILDING[OccupationTypes.GATHERER]).toBeUndefined()
    expect(OCCUPATION_BUILDING[OccupationTypes.WOODCUTTER]).toBeUndefined()
  })
})

describe('resolveTargetHeadcounts', () => {
  it('splits the workforce proportionally to the weights', () => {
    const targets = resolveTargetHeadcounts({
      distribution: { [OccupationTypes.GATHERER]: 50, [OccupationTypes.FARMER]: 50 },
      workforce: 10,
      activeOccupations: [OccupationTypes.GATHERER, OccupationTypes.FARMER],
    })
    expect(targets.get(OccupationTypes.GATHERER)).toBe(5)
    expect(targets.get(OccupationTypes.FARMER)).toBe(5)
  })

  it('renormalises weights when an occupation is inactive (locked building)', () => {
    // MINER's building is locked → excluded → its 50% is redistributed to GATHERER.
    const targets = resolveTargetHeadcounts({
      distribution: { [OccupationTypes.GATHERER]: 50, [OccupationTypes.MINER]: 50 },
      workforce: 10,
      activeOccupations: [OccupationTypes.GATHERER],
    })
    expect(targets.get(OccupationTypes.GATHERER)).toBe(10)
    expect(targets.get(OccupationTypes.MINER) ?? 0).toBe(0)
  })

  it('rounds so the total equals the workforce (largest remainder)', () => {
    const targets = resolveTargetHeadcounts({
      distribution: {
        [OccupationTypes.GATHERER]: 33,
        [OccupationTypes.FARMER]: 33,
        [OccupationTypes.MINER]: 34,
      },
      workforce: 10,
      activeOccupations: [
        OccupationTypes.GATHERER,
        OccupationTypes.FARMER,
        OccupationTypes.MINER,
      ],
    })
    const total = [...targets.values()].reduce((s, v) => s + v, 0)
    expect(total).toBe(10)
  })

  it('returns all zeros for an empty workforce', () => {
    const targets = resolveTargetHeadcounts({
      distribution: DEFAULT_OCCUPATION_DISTRIBUTION,
      workforce: 0,
      activeOccupations: DISTRIBUTABLE_OCCUPATIONS,
    })
    const total = [...targets.values()].reduce((s, v) => s + v, 0)
    expect(total).toBe(0)
  })

  it('returns an empty allocation when no occupation is active', () => {
    const targets = resolveTargetHeadcounts({
      distribution: DEFAULT_OCCUPATION_DISTRIBUTION,
      workforce: 10,
      activeOccupations: [],
    })
    const total = [...targets.values()].reduce((s, v) => s + v, 0)
    expect(total).toBe(0)
  })
})

describe('sanitizeOccupationDistribution', () => {
  it('accepts a full integer distribution summing to 100 and keeps only known keys', () => {
    const clean = sanitizeOccupationDistribution({ ...DEFAULT_OCCUPATION_DISTRIBUTION, foo: 999 })
    expect(clean).not.toBeNull()
    expect(new Set(Object.keys(clean!))).toEqual(new Set(DISTRIBUTABLE_OCCUPATIONS))
    expect((clean as Record<string, number>).foo).toBeUndefined()
    expect(Object.values(clean!).reduce((s, v) => s + v, 0)).toBe(100)
  })

  it('rejects a distribution that does not sum to 100', () => {
    expect(sanitizeOccupationDistribution({ ...DEFAULT_OCCUPATION_DISTRIBUTION, [OccupationTypes.FARMER]: 40 })).toBeNull()
  })

  it('rejects a partial distribution (missing occupations)', () => {
    expect(sanitizeOccupationDistribution({ [OccupationTypes.GATHERER]: 100 })).toBeNull()
  })

  it('rejects non-integer, negative and out-of-range values', () => {
    const base = { ...DEFAULT_OCCUPATION_DISTRIBUTION }
    expect(sanitizeOccupationDistribution({ ...base, [OccupationTypes.GATHERER]: 22.5 })).toBeNull()
    expect(sanitizeOccupationDistribution({ ...base, [OccupationTypes.GATHERER]: -1 })).toBeNull()
    expect(sanitizeOccupationDistribution({ ...base, [OccupationTypes.GATHERER]: 122 })).toBeNull()
  })

  it('rejects non-object inputs', () => {
    expect(sanitizeOccupationDistribution(undefined)).toBeNull()
    expect(sanitizeOccupationDistribution(null)).toBeNull()
    expect(sanitizeOccupationDistribution(42)).toBeNull()
  })
})
