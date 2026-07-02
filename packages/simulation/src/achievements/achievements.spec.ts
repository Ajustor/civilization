import {
  ACHIEVEMENTS,
  AchievementId,
  computeAchievementScore,
  evaluateAchievements,
  getAchievement,
} from './achievements'
import { Civilization } from '../civilization'
import { People } from '../people/people'
import { Gender } from '../people/enum'
import { TechId } from '../technology/techTree'
import { Resource, ResourceTypes } from '../resource'

const civWithPeople = (count: number, ageYears = 25) => {
  const civ = new Civilization('Achievers')
  for (let i = 0; i < count; i++) {
    const person = new People({
      month: ageYears * 12,
      gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
      lifeCounter: 10,
    })
    person.id = `p-${i}`
    civ.addPeople(person)
  }
  return civ
}

describe('achievements catalog', () => {
  it('has unique ids and positive points', () => {
    const ids = new Set(ACHIEVEMENTS.map((achievement) => achievement.id))
    expect(ids.size).toBe(ACHIEVEMENTS.length)
    for (const achievement of ACHIEVEMENTS) {
      expect(achievement.points).toBeGreaterThan(0)
    }
  })
  it('computes a score from unlocked ids, ignoring unknown ones', () => {
    const first = getAchievement(AchievementId.FIRST_TECH)!
    const decade = getAchievement(AchievementId.DECADE)!
    expect(
      computeAchievementScore([first.id, decade.id, 'removed-achievement']),
    ).toBe(first.points + decade.points)
  })
})

describe('evaluateAchievements', () => {
  it('unlocks population milestones once the threshold is reached', () => {
    const civ = civWithPeople(100)
    const unlocked = evaluateAchievements(civ).map((achievement) => achievement.id)
    expect(unlocked).toContain(AchievementId.POPULATION_100)
    expect(unlocked).not.toContain(AchievementId.POPULATION_250)
  })
  it('does not re-unlock already owned achievements', () => {
    const civ = civWithPeople(100)
    const unlocked = evaluateAchievements(civ, [AchievementId.POPULATION_100])
    expect(unlocked.map((achievement) => achievement.id)).not.toContain(
      AchievementId.POPULATION_100,
    )
  })
  it('unlocks science and resource achievements', () => {
    const civ = civWithPeople(2)
    civ.researchedTechs = [TechId.CRAFTSMANSHIP]
    civ.addResource(new Resource(ResourceTypes.RAW_FOOD, 10_000))
    const unlocked = evaluateAchievements(civ).map((achievement) => achievement.id)
    expect(unlocked).toContain(AchievementId.FIRST_TECH)
    expect(unlocked).toContain(AchievementId.FOOD_10K)
  })
  it('unlocks the elder achievement with an 85-year-old citizen', () => {
    const civ = civWithPeople(1, 85)
    const unlocked = evaluateAchievements(civ).map((achievement) => achievement.id)
    expect(unlocked).toContain(AchievementId.ELDER)
  })
  it('never evaluates event-based achievements (no isUnlocked)', () => {
    const civ = civWithPeople(1)
    const unlocked = evaluateAchievements(civ).map((achievement) => achievement.id)
    expect(unlocked).not.toContain(AchievementId.FIRST_VICTORY)
    expect(unlocked).not.toContain(AchievementId.FIRST_COLONY)
  })
})
