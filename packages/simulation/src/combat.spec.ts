import { resolveBattle } from './combat'

describe('resolveBattle', () => {
  it('declares the stronger side the winner', () => {
    const outcome = resolveBattle({ strength: 100 }, { strength: 40 })
    expect(outcome.attackerWins).toBe(true)
  })

  it('makes both sides lose a fraction proportional to the enemy strength', () => {
    const outcome = resolveBattle({ strength: 100 }, { strength: 100 })
    expect(outcome.attackerLossRatio).toBeCloseTo(0.5)
    expect(outcome.defenderLossRatio).toBeCloseTo(0.5)
  })

  it('handles a defender with no army (attacker wins, takes no losses)', () => {
    const outcome = resolveBattle({ strength: 50 }, { strength: 0 })
    expect(outcome.attackerWins).toBe(true)
    expect(outcome.attackerLossRatio).toBe(0)
    expect(outcome.defenderLossRatio).toBe(1)
  })

  it('reports no battle when neither side has any strength', () => {
    const outcome = resolveBattle({ strength: 0 }, { strength: 0 })
    expect(outcome.fought).toBe(false)
  })
})
