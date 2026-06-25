export type BattleSide = {
  strength: number
}

export type BattleOutcome = {
  fought: boolean
  attackerWins: boolean
  attackerLossRatio: number
  defenderLossRatio: number
}

/**
 * Resolves one battle from the two sides' strengths. Each side loses a fraction
 * of its forces equal to the enemy's share of the total strength; the stronger
 * side wins. No battle happens when both sides are empty.
 */
export function resolveBattle(
  attacker: BattleSide,
  defender: BattleSide,
): BattleOutcome {
  const total = attacker.strength + defender.strength
  if (total <= 0) {
    return {
      fought: false,
      attackerWins: false,
      attackerLossRatio: 0,
      defenderLossRatio: 0,
    }
  }

  return {
    fought: true,
    attackerWins: attacker.strength >= defender.strength,
    attackerLossRatio: defender.strength / total,
    defenderLossRatio: attacker.strength / total,
  }
}
