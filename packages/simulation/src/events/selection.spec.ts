import { Events } from './enum'
import { BASE_EVENT_WEIGHTS, buildEventWeights, pickWeightedEvent } from './selection'

const baseWeight = (event: Events | null) =>
  BASE_EVENT_WEIGHTS.find((w) => w.event === event)!.weight

describe('event selection', () => {
  describe('buildEventWeights', () => {
    it('leaves weights unchanged when there is no streak', () => {
      expect(buildEventWeights(null, 0)).toEqual([...BASE_EVENT_WEIGHTS])
    })

    it('halves the last event weight on the first repeat (streak 1)', () => {
      const weights = buildEventWeights(Events.MIGRATION, 1)
      const migration = weights.find((w) => w.event === Events.MIGRATION)!
      expect(migration.weight).toBe(baseWeight(Events.MIGRATION) / 2)
    })

    it('divides by (1 + streak) as the streak grows', () => {
      const weights = buildEventWeights(Events.EARTHQUAKE, 3)
      const earthquake = weights.find((w) => w.event === Events.EARTHQUAKE)!
      expect(earthquake.weight).toBe(baseWeight(Events.EARTHQUAKE) / 4)
    })

    it('never penalises the calm (null) bucket', () => {
      expect(buildEventWeights(null, 5)).toEqual([...BASE_EVENT_WEIGHTS])
    })

    it('only penalises the matching event, others stay at their base weight', () => {
      const weights = buildEventWeights(Events.MIGRATION, 2)
      for (const { event, weight } of weights) {
        if (event === Events.MIGRATION) {
          expect(weight).toBe(baseWeight(Events.MIGRATION) / 3)
        } else {
          expect(weight).toBe(baseWeight(event))
        }
      }
    })
  })

  describe('pickWeightedEvent', () => {
    it('returns the first bucket at random 0', () => {
      expect(pickWeightedEvent(BASE_EVENT_WEIGHTS, 0)).toBe(Events.EARTHQUAKE)
    })

    it('lands in the right bucket at known boundaries (total = 100)', () => {
      // EARTHQUAKE occupies [0,10): 0.05×100 = 5
      expect(pickWeightedEvent(BASE_EVENT_WEIGHTS, 0.05)).toBe(Events.EARTHQUAKE)
      // STARVATION occupies [10,20): 0.15×100 = 15
      expect(pickWeightedEvent(BASE_EVENT_WEIGHTS, 0.15)).toBe(Events.STARVATION)
      // MIGRATION occupies [20,35): 0.30×100 = 30
      expect(pickWeightedEvent(BASE_EVENT_WEIGHTS, 0.3)).toBe(Events.MIGRATION)
    })

    it('returns the calm (null) bucket at the top of the range', () => {
      // null occupies [95,100): 0.99×100 = 99
      expect(pickWeightedEvent(BASE_EVENT_WEIGHTS, 0.99)).toBeNull()
    })

    it('renormalises after a penalty (reduced total still covers [0,1))', () => {
      const penalised = buildEventWeights(Events.MIGRATION, 1) // total = 92.5
      // Sweeping random across [0,1) must always return a defined bucket.
      for (let r = 0; r < 1; r += 0.05) {
        const pick = pickWeightedEvent(penalised, r)
        expect(pick === null || Object.values(Events).includes(pick)).toBe(true)
      }
    })

    it('returns null for an empty / zero-total weight set', () => {
      expect(pickWeightedEvent([], 0.5)).toBeNull()
    })
  })
})
